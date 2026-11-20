import os
import re
import secrets
from pathlib import Path
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

import pymysql
from flask import send_from_directory, render_template, Flask, abort, g, jsonify, request, session
from pymysql.cursors import DictCursor
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__, static_folder="map-preview", static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_bytes(32)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


STATUSES = ("Available", "Unavailable")
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024
PHOTO_DIR = Path(app.instance_path) / "report-photos" / os.getenv("DB_NAME", "campus_atlas")


def connect():
    if "db" not in g:
        g.db = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"), port=int(os.getenv("DB_PORT", "3306")),
            unix_socket=os.getenv("DB_SOCKET"), user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""), database=os.getenv("DB_NAME", "campus_atlas"),
            cursorclass=DictCursor, autocommit=True,
        )
        # Hong Kong has no daylight saving. TIMESTAMP values are stored in UTC and
        # converted with the session time zone, so this keeps CURRENT_TIMESTAMP in HKT.
        with g.db.cursor() as cursor:
            cursor.execute("SET time_zone = '+08:00'")
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
    uid = session.get("admin") or session.get("student")
    user_rows = query("SELECT userID, user_name, email FROM users WHERE userID=%s", (uid,)) if uid else ()
    facilities = query(
        "SELECT f.facilityID, f.buildingID, f.categoryID, f.floor, f.facility_status, "
        "COUNT(r.reportID) AS report_count, "
        "COUNT(CASE WHEN r.review_status='Pending' THEN 1 END) AS pending_count "
        "FROM facilities f LEFT JOIN reports r ON r.facilityID=f.facilityID "
        "WHERE NOT f.archived "
        "GROUP BY f.facilityID, f.buildingID, f.categoryID, f.floor, f.facility_status "
        "ORDER BY f.facilityID"
    )
    return jsonify(buildings=query("SELECT buildingID, build_name, campus, map_x, map_y FROM buildings ORDER BY build_name"),
                   categories=query("SELECT categoryID, category_name FROM categories ORDER BY category_name"),
                   facilities=facilities,
                   admin=bool(session.get("admin")), student=bool(session.get("student")),
                   user=user_rows[0] if user_rows else None)


@app.post("/api/session")
def login():
    data = request.get_json() or {}
    role = "student" if data.get("role") == "student" else "admin"
    table = "students" if role == "student" else "admins"
    email = data.get("email")
    password = data.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        abort(401)
    rows = query(f"SELECT u.userID, u.user_password FROM users u JOIN {table} s USING (userID) WHERE email=%s", (email.strip().lower(),))
    if not rows:
        abort(401)
    stored = rows[0]["user_password"]
    valid = check_password_hash(stored, password) if stored.startswith("pbkdf2:") else stored == password
    if not valid:
        abort(401)
    session.clear()
    session[role] = rows[0]["userID"]
    return "", 204


@app.post("/api/students")
def register_student():
    data = request.get_json()
    email = data.get("email") if isinstance(data, dict) else None
    email = email.strip().lower() if isinstance(email, str) else ""
    if not re.fullmatch(r"[a-z0-9_-]+(?:\.[a-z0-9_-]+)*@(?:connect\.)?hku\.hk", email) or len(email.split("@")[0]) > 64:
        return jsonify(error="Use your @connect.hku.hk or @hku.hk email."), 400
    password = data.get("password")
    if not isinstance(password, str) or not 8 <= len(password) <= 128:
        return jsonify(error="Choose a password with 8 to 128 characters."), 400
    password_hash = generate_password_hash(password, method="pbkdf2:sha256:600000")

    def create(cursor):
        cursor.execute("INSERT INTO users (user_name,email,user_password) VALUES (%s,%s,%s)",
                       (email.split("@")[0], email, password_hash))
        uid = cursor.lastrowid
        cursor.execute("INSERT INTO students (userID) VALUES (%s)", (uid,))
        return uid

    try:
        uid = transaction(create)
    except pymysql.err.IntegrityError as error:
        if error.args[0] == 1062:
            return jsonify(error="This email is already registered. Sign in to continue."), 409
        raise
    session.clear()
    session["student"] = uid
    return jsonify(userID=uid), 201


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
    if not 1 <= len(floor) <= 20 or status not in STATUSES:
        abort(400)
    values = (data.get("buildingID"), data.get("categoryID"), floor, status)
    try:
        if facility_id is None:
            query("INSERT INTO facilities (buildingID, categoryID, floor, facility_status) VALUES (%s,%s,%s,%s)", values, True)
        else:
            def edit(cursor):
                cursor.execute("SELECT facility_status FROM facilities WHERE facilityID=%s AND NOT archived FOR UPDATE", (facility_id,))
                old = cursor.fetchone()
                if not old:
                    abort(404)
                cursor.execute("UPDATE facilities SET buildingID=%s, categoryID=%s, floor=%s, facility_status=%s WHERE facilityID=%s", (*values, facility_id))
                if old["facility_status"] != status:
                    cursor.execute("INSERT INTO revisions (facilityID, adminID, old_status, new_status) VALUES (%s,%s,%s,%s)",
                                   (facility_id, session["admin"], old["facility_status"], status))
                    cursor.execute("UPDATE reports SET review_status='Expired' WHERE facilityID=%s AND review_status='Pending' AND report_create_time<CURRENT_TIMESTAMP", (facility_id,))
            transaction(edit)
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
        "SELECT v.revisionID, v.reportID, v.old_status, v.new_status, CAST(v.revision_create_time AS CHAR) AS revision_time, "
        "admin_user.user_name AS admin_name, student_user.user_name AS student_name "
        "FROM revisions v LEFT JOIN reports r ON r.reportID=v.reportID "
        "JOIN users admin_user ON admin_user.userID=v.adminID "
        "LEFT JOIN users student_user ON student_user.userID=r.studentID "
        "WHERE v.facilityID=%s ORDER BY v.revision_create_time, v.revisionID",
        (facility_id,),
    )
    return jsonify(facility=facility[0], revisions=revisions)


def role(name):
    return session.get(name) or abort(403)


def notification_table():
    if session.get("student"):
        return "review_notifications", "studentID", "review_is_read", session["student"]
    return "new_notifications", "adminID", "new_is_read", role("admin")


@app.get("/api/notifications")
def list_notifications():
    table, column, flag, uid = notification_table()
    return jsonify(query(
        f"SELECT n.notificationID, n.reportID, n.{flag} AS is_read, r.review_status, "
        "CAST(t.notification_create_time AS CHAR) AS created, b.build_name, c.category_name, f.floor "
        f"FROM {table} n JOIN notifications t USING(notificationID) JOIN reports r USING(reportID) "
        "JOIN facilities f USING(facilityID) JOIN buildings b USING(buildingID) JOIN categories c USING(categoryID) "
        f"WHERE n.{column}=%s ORDER BY t.notification_create_time DESC,n.notificationID DESC", (uid,)))


@app.put("/api/notifications/<int:nid>")
def read_notification(nid):
    table, column, flag, uid = notification_table()
    query(f"UPDATE {table} SET {flag}=TRUE WHERE notificationID=%s AND {column}=%s", (nid, uid), True)
    return "", 204


@app.get("/api/favorites")
def favorite_ids():
    return jsonify([r["facilityID"] for r in query("SELECT facilityID FROM favorites WHERE studentID=%s", (role("student"),))])


@app.route("/api/favorites/<int:record_id>", methods=["PUT", "DELETE"])
@app.route("/api/likes/<int:record_id>", methods=["PUT", "DELETE"])
def toggle_link(record_id):
    uid = role("student")
    favorite = request.path.startswith("/api/favorites/")
    table, column = ("favorites", "facilityID") if favorite else ("likes", "reportID")
    if request.method == "DELETE":
        query(f"DELETE FROM {table} WHERE studentID=%s AND {column}=%s", (uid, record_id), True)
    else:
        source = "facilities WHERE NOT archived AND facilityID=%s" if favorite else "reports JOIN facilities USING(facilityID) WHERE NOT archived AND reportID=%s"
        count = query(f"INSERT INTO {table} (studentID,{column}) SELECT %s,%s FROM {source} ON DUPLICATE KEY UPDATE studentID=%s",
                      (uid, record_id, record_id, uid), True)
        if not count and not query(f"SELECT 1 FROM {table} WHERE studentID=%s AND {column}=%s", (uid, record_id)):
            abort(404)
    return "", 204


@app.get("/api/reports")
def list_reports():
    student = session.get("student")
    if not student:
        role("admin")
    facility = request.args.get("facilityID", type=int)
    condition = ""
    args = []
    if student and facility is None:
        condition = "WHERE r.studentID=%s"
        args.append(student)
    elif facility is not None:
        condition = "WHERE f.facilityID=%s AND NOT f.archived"
        args.append(facility)
    rows = query(
        "SELECT r.reportID,r.studentID,r.facilityID,r.create_note,r.review_note,r.proposed_status,r.review_status,"
        "CAST(r.report_create_time AS CHAR) AS created,CAST(r.review_time AS CHAR) AS reviewed,"
        "f.buildingID,f.facility_status,f.floor,b.build_name,c.category_name,u.user_name,v.old_status,v.new_status,"
        "(SELECT COUNT(*) FROM likes l WHERE l.reportID=r.reportID) AS like_count,"
        "EXISTS(SELECT 1 FROM likes l WHERE l.reportID=r.reportID AND l.studentID=%s) AS liked "
        "FROM reports r JOIN facilities f USING(facilityID) JOIN buildings b USING(buildingID) "
        "JOIN categories c USING(categoryID) JOIN users u ON u.userID=r.studentID LEFT JOIN revisions v ON v.reportID=r.reportID "
        + condition + " ORDER BY " + ("like_count DESC, " if not student else "") + "r.report_create_time DESC,r.reportID DESC", (student,*args))
    by_id = {r["reportID"]:r for r in rows}
    for row in rows:
        row["photos"] = []
    if rows:
        for photo in query("SELECT reportID,photo FROM report_photos WHERE reportID IN %s ORDER BY photo", (tuple(by_id),)):
            filename = photo["photo"]
            by_id[photo["reportID"]]["photos"].append({"name":filename, "available":(PHOTO_DIR / filename).is_file()})
    return jsonify(reports=rows)


@app.get("/api/photos/<filename>")
def show_photo(filename):
    if not (session.get("student") or session.get("admin")):
        abort(403)
    return send_from_directory(PHOTO_DIR, filename)


def notify(cursor, report_id, student=None):
    table, column = ("review_notifications", "studentID") if student else ("new_notifications", "adminID")
    if student:
        recipients = [student]
    else:
        cursor.execute("SELECT userID FROM admins")
        recipients = [r["userID"] for r in cursor.fetchall()]
    for uid in recipients:
        cursor.execute("INSERT INTO notifications () VALUES ()")
        cursor.execute(f"INSERT INTO {table} (notificationID,reportID,{column}) VALUES (%s,%s,%s)", (cursor.lastrowid, report_id, uid))


@app.post("/api/reports")
def submit_report():
    uid = role("student")
    data = request.get_json() if request.is_json else request.form
    status = data.get("proposed_status")
    files = [f for f in request.files.getlist("photos") if f.filename]
    if status not in STATUSES or len(files)>6:
        abort(400)
    saved = []
    def submit(cursor):
        cursor.execute("SELECT facilityID FROM facilities WHERE facilityID=%s AND NOT archived FOR UPDATE", (data.get("facilityID"),))
        if not cursor.fetchone():
            abort(404)
        cursor.execute("INSERT INTO reports (facilityID,studentID,proposed_status,review_status,create_note) VALUES (%s,%s,%s,'Pending',%s)",
                       (data["facilityID"],uid,status,data.get("create_note") or None))
        rid = cursor.lastrowid
        for path in saved:
            cursor.execute("INSERT INTO report_photos VALUES (%s,%s)", (rid,path.name))
        notify(cursor,rid)
        return rid
    try:
        for file in files:
            PHOTO_DIR.mkdir(parents=True,exist_ok=True)
            with Image.open(file.stream, formats=["JPEG","PNG","WEBP"]) as img:
                if img.width * img.height > 20000000:
                    abort(400)
                img.thumbnail((2048,2048))
                path = PHOTO_DIR / (uuid4().hex + ".jpg")
                saved.append(path)
                img.convert("RGB").save(path,quality=85)
        rid = transaction(submit)
    except Exception as error:
        for path in saved:
            path.unlink(missing_ok=True)
        if isinstance(error,(UnidentifiedImageError, Image.DecompressionBombError, SyntaxError, OSError)) and not isinstance(error,PermissionError):
            abort(400)
        raise
    return jsonify(reportID=rid),201


@app.delete("/api/reports/<int:report_id>")
def delete_report(report_id):
    uid = role("student")
    def withdraw(cursor):
        cursor.execute("SELECT 1 FROM reports WHERE reportID=%s AND studentID=%s AND review_status='Pending' FOR UPDATE", (report_id,uid))
        if not cursor.fetchone():
            abort(404)
        cursor.execute("SELECT photo FROM report_photos WHERE reportID=%s", (report_id,))
        photos = cursor.fetchall()
        cursor.execute("SELECT notificationID FROM new_notifications WHERE reportID=%s", (report_id,))
        notices = cursor.fetchall()
        for table in ("new_notifications","likes","report_photos","reports"):
            cursor.execute(f"DELETE FROM {table} WHERE reportID=%s", (report_id,))
        for notice in notices:
            cursor.execute("DELETE FROM notifications WHERE notificationID=%s", (notice["notificationID"],))
        return photos
    for photo in transaction(withdraw):
        filename = photo["photo"]
        if len(filename)==36 and filename.endswith(".jpg") and all(c in "0123456789abcdef" for c in filename[:-4]):
            (PHOTO_DIR / filename).unlink(missing_ok=True)
    return "",204


@app.post("/api/reports/<int:report_id>/review")
def review_report(report_id):
    uid = role("admin")
    data = request.get_json()
    decision = data.get("review_status")
    if decision not in ("Approved","Rejected"):
        abort(400)
    def review(cursor):
        cursor.execute("SELECT facilityID FROM reports WHERE reportID=%s", (report_id,))
        report = cursor.fetchone()
        if not report:
            abort(404)
        fid = report["facilityID"]
        cursor.execute("SELECT facility_status FROM facilities WHERE facilityID=%s AND NOT archived FOR UPDATE", (fid,))
        facility = cursor.fetchone()
        cursor.execute("SELECT * FROM reports WHERE reportID=%s AND review_status='Pending' FOR UPDATE", (report_id,))
        report = cursor.fetchone()
        if not facility or not report:
            abort(409)
        cursor.execute("UPDATE reports SET review_status=%s,adminID=%s,review_note=%s,review_time=CURRENT_TIMESTAMP WHERE reportID=%s",
                       (decision,uid,data.get("review_note") or None,report_id))
        if decision == "Approved":
            cursor.execute("UPDATE facilities SET facility_status=%s WHERE facilityID=%s", (report["proposed_status"],fid))
            cursor.execute("INSERT INTO revisions (facilityID,reportID,adminID,old_status,new_status) VALUES (%s,%s,%s,%s,%s)",
                           (fid,report_id,uid,facility["facility_status"],report["proposed_status"]))
            cursor.execute("UPDATE reports SET review_status='Expired' WHERE facilityID=%s AND review_status='Pending' AND report_create_time<%s",
                           (fid,report["report_create_time"]))
        notify(cursor,report_id,report["studentID"])
    transaction(review)
    return "",204
