import os
import secrets

import pymysql
from flask import render_template, Flask, abort, g, jsonify, request, session
from pymysql.cursors import DictCursor
from werkzeug.security import check_password_hash

app = Flask(__name__, static_folder="map-preview", static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_bytes(32)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


def query(sql, args=(), write=False):
    if "db" not in g:
        g.db = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"), port=int(os.getenv("DB_PORT", "3306")),
            unix_socket=os.getenv("DB_SOCKET"), user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""), database=os.getenv("DB_NAME", "campus_atlas"),
            cursorclass=DictCursor, autocommit=True,
        )
    with g.db.cursor() as cursor:
        cursor.execute(sql, args)
        return cursor.rowcount if write else cursor.fetchall()


@app.teardown_appcontext
def close_db(_error):
    if "db" in g:
        g.db.close()


@app.get("/")
@app.get("/index.html")
@app.get("/admin")
def home():
    return render_template("index.html", admin_page=request.path == "/admin")


@app.get("/api/map")
def campus_map():
    return jsonify(buildings=query("SELECT buildingID, build_name, map_x, map_y FROM buildings ORDER BY build_name"),
                   categories=query("SELECT categoryID, category_name FROM categories ORDER BY category_name"),
                   facilities=query("SELECT facilityID, buildingID, categoryID, floor, facility_status FROM facilities WHERE NOT archived ORDER BY facilityID"),
                   admin=bool(session.get("admin")))


@app.post("/api/session")
def login():
    data = request.get_json()
    rows = query("SELECT u.userID, u.user_password FROM users u JOIN admins a USING (userID) WHERE email=%s", (data["email"],))
    if not rows or not check_password_hash(rows[0]["user_password"], data["password"]):
        abort(401)
    session.clear()
    session["admin"] = rows[0]["userID"]
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
