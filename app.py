import os
import secrets

import pymysql
from flask import render_template, Flask, abort, g, jsonify, request, session
from pymysql.cursors import DictCursor

app = Flask(__name__, static_folder="map-preview", static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_bytes(32)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


STATUSES = ("Available", "Unavailable", "Unknown")


def connect():
    if "db" not in g:
        g.db = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"), port=int(os.getenv("DB_PORT", "3306")),
            unix_socket=os.getenv("DB_SOCKET"), user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""), database=os.getenv("DB_NAME", "campus_atlas"),
            cursorclass=DictCursor, autocommit=True,
        )
    return g.db


def query(sql, args=(), write=False):
    with connect().cursor() as cursor:
        cursor.execute(sql, args)
        return cursor.rowcount if write else cursor.fetchall()


def transaction(callback):
    connection = connect()
    connection.begin()
    try:
        with connection.cursor() as cursor:
            result = callback(cursor)
        connection.commit()
        return result
    except Exception:
        connection.rollback()
        raise


@app.teardown_appcontext
def close_db(_error):
    if "db" in g:
        g.db.close()


@app.get("/")
@app.get("/index.html")
@app.get("/admin")
@app.get("/student")
def home():
    return render_template("index.html", admin_page=request.path == "/admin", student_page=request.path == "/student")


@app.get("/api/map")
def campus_map():
    return jsonify(buildings=query("SELECT buildingID, build_name, map_x, map_y FROM buildings ORDER BY build_name"),
                   categories=query("SELECT categoryID, category_name FROM categories ORDER BY category_name"),
                   facilities=query("SELECT facilityID, buildingID, categoryID, floor, facility_status FROM facilities WHERE NOT archived ORDER BY facilityID"),
                   admin=bool(session.get("admin")), student=bool(session.get("student")))


@app.post("/api/session")
def login():
    data = request.get_json() or {}
    role = "student" if data.get("role") == "student" else "admin"
    table = "students" if role == "student" else "admins"
    rows = query(f"SELECT u.userID, u.user_password FROM users u JOIN {table} s USING (userID) WHERE email=%s", (data.get("email"),))
    if not rows or rows[0]["user_password"] != data.get("password"):
        abort(401)
    session.clear()
    session[role] = rows[0]["userID"]
    return "", 204


@app.delete("/api/session")
def logout():
    session.clear()
    return "", 204


@app.post("/api/facilities")
@app.route("/api/facilities/<int:facility_id>", methods=["PUT", "DELETE"])
def save_facility(facility_id=None):
    if not session.get("admin"):
        abort(403)
    if request.method == "DELETE":
        if not query("UPDATE facilities SET archived=TRUE WHERE facilityID=%s AND NOT archived", (facility_id,), True):
            abort(404)
        return "", 204
    data = request.get_json()
    floor = str(data.get("floor") or "").strip()
    status = data.get("facility_status")
    if not 1 <= len(floor) <= 20 or status not in ("Available", "Unavailable", "Unknown"):
        abort(400)
    values = (data.get("buildingID"), data.get("categoryID"), floor, status)
    try:
        if facility_id is None:
            query("INSERT INTO facilities (buildingID, categoryID, floor, facility_status) VALUES (%s,%s,%s,%s)", values, True)
        else:
            count = query("UPDATE facilities SET buildingID=%s, categoryID=%s, floor=%s, facility_status=%s WHERE facilityID=%s AND NOT archived", (*values, facility_id), True)
            if not count and not query("SELECT 1 FROM facilities WHERE facilityID=%s AND NOT archived", (facility_id,)):
                abort(404)
    except (pymysql.IntegrityError, pymysql.DataError):
        abort(400)
    return "", 204


@app.get("/api/facilities/<int:facility_id>/revisions")
def facility_revisions(facility_id):
    if not session.get("admin"):
        abort(403)
    facility = query(
        "SELECT f.facilityID, f.floor, f.facility_status, b.build_name, c.category_name "
        "FROM facilities f JOIN buildings b ON b.buildingID=f.buildingID "
        "JOIN categories c ON c.categoryID=f.categoryID WHERE f.facilityID=%s",
        (facility_id,),
    )
    if not facility:
        abort(404)
    revisions = query(
        "SELECT v.revisionID, v.reportID, v.old_status, v.new_status, "
        "admin_user.user_name AS admin_name, student_user.user_name AS student_name "
        "FROM revisions v JOIN reports r ON r.reportID=v.reportID "
        "JOIN users admin_user ON admin_user.userID=v.adminID "
        "JOIN users student_user ON student_user.userID=r.studentID "
        "WHERE r.facilityID=%s ORDER BY v.revisionID",
        (facility_id,),
    )
    return jsonify(facility=facility[0], revisions=revisions)


@app.get("/api/reports")
def list_reports():
    if session.get("student"):
        reports = query(
            "SELECT r.reportID, r.facilityID, f.buildingID, b.build_name, c.category_name, f.floor, "
            "f.facility_status, r.proposed_status, r.review_status, v.old_status, v.new_status "
            "FROM reports r JOIN facilities f ON f.facilityID=r.facilityID "
            "JOIN buildings b ON b.buildingID=f.buildingID JOIN categories c ON c.categoryID=f.categoryID "
            "LEFT JOIN revisions v ON v.reportID=r.reportID "
            "WHERE r.studentID=%s ORDER BY r.reportID DESC",
            (session["student"],),
        )
    elif session.get("admin"):
        reports = query(
            "SELECT r.reportID, r.facilityID, f.buildingID, u.user_name, b.build_name, c.category_name, f.floor, "
            "f.facility_status, r.proposed_status, r.review_status, v.old_status, v.new_status "
            "FROM reports r JOIN facilities f ON f.facilityID=r.facilityID "
            "JOIN buildings b ON b.buildingID=f.buildingID JOIN categories c ON c.categoryID=f.categoryID "
            "JOIN users u ON u.userID=r.studentID LEFT JOIN revisions v ON v.reportID=r.reportID "
            "ORDER BY r.review_status='Pending' DESC, r.reportID DESC",
        )
    else:
        abort(403)
    return jsonify(reports=reports)


@app.post("/api/reports")
def submit_report():
    student_id = session.get("student")
    if not student_id:
        abort(403)
    data = request.get_json() or {}
    status = data.get("proposed_status")
    try:
        facility_id = int(data.get("facilityID"))
    except (TypeError, ValueError):
        abort(400)
    if status not in STATUSES:
        abort(400)
    count = query(
        "INSERT INTO reports (facilityID, studentID, adminID, proposed_status, review_status) "
        "SELECT %s, %s, NULL, %s, 'Pending' FROM students WHERE userID=%s "
        "AND EXISTS (SELECT 1 FROM facilities WHERE facilityID=%s AND NOT archived)",
        (facility_id, student_id, status, student_id, facility_id), True,
    )
    if not count:
        abort(400)
    return "", 204


@app.delete("/api/reports/<int:report_id>")
def delete_report(report_id):
    student_id = session.get("student")
    if not student_id:
        abort(403)

    def apply(cursor):
        cursor.execute(
            "DELETE FROM reports WHERE reportID=%s AND studentID=%s AND review_status='Pending'",
            (report_id, student_id),
        )
        return cursor.rowcount == 1

    try:
        if not transaction(apply):
            abort(404)
    except (pymysql.IntegrityError, pymysql.DataError):
        abort(400)
    return "", 204


@app.post("/api/reports/<int:report_id>/review")
def review_report(report_id):
    admin_id = session.get("admin")
    if not admin_id:
        abort(403)
    decision = (request.get_json() or {}).get("review_status")
    if decision not in ("Approved", "Rejected"):
        abort(400)

    def apply(cursor):
        cursor.execute(
            "SELECT r.facilityID, f.facility_status AS old_status, r.proposed_status AS new_status "
            "FROM reports r JOIN facilities f ON f.facilityID=r.facilityID "
            "WHERE r.reportID=%s AND r.review_status='Pending' "
            "AND EXISTS (SELECT 1 FROM admins WHERE userID=%s) FOR UPDATE",
            (report_id, admin_id),
        )
        row = cursor.fetchone()
        if not row:
            return False
        cursor.execute(
            "UPDATE reports SET review_status=%s, adminID=%s WHERE reportID=%s AND review_status='Pending'",
            (decision, admin_id, report_id),
        )
        if decision == "Approved":
            cursor.execute("UPDATE facilities SET facility_status=%s WHERE facilityID=%s", (row["new_status"], row["facilityID"]))
            cursor.execute(
                "INSERT INTO revisions (reportID, adminID, old_status, new_status) VALUES (%s,%s,%s,%s)",
                (report_id, admin_id, row["old_status"], row["new_status"]),
            )
        return True

    try:
        if not transaction(apply):
            abort(404)
    except (pymysql.IntegrityError, pymysql.DataError):
        abort(400)
    return "", 204
