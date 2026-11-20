# Campus Atlas

Campus Atlas is a COMP3278 database project for finding campus facilities and reporting changes to their availability. The app uses Flask, PyMySQL, MySQL and a Leaflet map of HKU.

## Functions

- **Guest:** browse facilities, filter by building or category, and locate their buildings on the map.
- **Student:** sign in, submit a proposed facility status, view personal reports, and withdraw a report while it is pending.
- **Administrator:** add, edit and archive facilities; approve or reject reports; view the history of approved status changes.

Students report changes to existing facilities; they do not create buildings or facilities. Facility statuses are `Available` and `Unavailable`.

## Requirements

- Python 3.9 or later, with `pip` and `venv` available.
- MySQL 8.0 or later, with the **server running** and the command-line client installed. The schema uses a MySQL 8 collation; it is not a MariaDB schema.
- A MySQL account able to create the database/tables, insert the seed data, and read/write the application tables.
- A web browser. Internet access is needed to install Python packages; Leaflet and the map image are bundled locally.

Run the commands below from the repository root, the folder containing `app.py`, `requirements.txt` and `database/`. The main instructions use macOS/Linux shell syntax. Create your own virtual environment; `.venv` is not supplied with the project.

## 1. Install Python dependencies

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

All Python commands explicitly use the same environment, so activation is optional. Installing these requirements installs Flask and PyMySQL, **not the MySQL server or the `mysql` command**.

## 2. Create the database and import initial data

Start your installed MySQL server using its service manager or installer controls. For the commands below, use your own MySQL username, host and port if they differ from `root`, `127.0.0.1` and `3306`.

```sh
mysql -h 127.0.0.1 -P 3306 -u root -p < database/db/schema.sql
mysql -h 127.0.0.1 -P 3306 -u root -p < database/db/seed.sql
```

Enter your **MySQL account password** when prompted. This is separate from the web app's demo account passwords. Import `schema.sql` first, then `seed.sql`; no separate data download is required.

Both scripts use the database name `campus_atlas`. Run them once against a fresh database: they are initialization scripts, not migrations. Do not rerun them over an existing project database containing work you want to keep. If tables already exist, use the existing initialized database or prepare a separate clean MySQL instance for a fresh demo.

### If `mysql` is not on PATH

Replace `mysql` with the full path to **your installed client** in each command. For example, only if your installation uses this path:

```sh
/usr/local/mysql/bin/mysql -h 127.0.0.1 -P 3306 -u root -p < database/db/schema.sql
/usr/local/mysql/bin/mysql -h 127.0.0.1 -P 3306 -u root -p < database/db/seed.sql
```

Alternatively, add the directory containing the executable to `PATH`. For the example above:

```sh
export PATH="/usr/local/mysql/bin:$PATH"
```

This affects the current shell. To keep it for future zsh terminals, put that line in `~/.zshrc`, then open a new terminal or run `source ~/.zshrc`. Other installations may use a different directory. Clearing the shell's command cache does not add a missing directory to `PATH`.

### Check the imported data

```sh
mysql -h 127.0.0.1 -P 3306 -u root -p campus_atlas -e "SHOW TABLES; SELECT COUNT(*) AS facilities FROM facilities; SELECT review_status, COUNT(*) AS total FROM reports GROUP BY review_status;"
```

Immediately after a fresh import, expect:

| Data | Count |
| --- | ---: |
| Tables | 14 |
| Users | 10 (6 students, 4 administrators) |
| Buildings | 12 |
| Categories | 3 |
| Facilities | 34 (33 visible, 1 archived) |
| Reports | 12 (5 Pending, 4 Approved, 1 Rejected, 2 Expired) |
| Revisions | 6 |

The seed includes demonstration records and sample facilities from the RIC Campus Map dataset. The seed includes sample photo filenames. Upload JPEG, PNG or WebP images to see photo previews. Uploaded images are stored under `instance/report-photos/<database>/`.

## 3. Configure and run Flask

In the same terminal that will start Flask, set the connection values to match the MySQL instance used above. Replace the password placeholder with your actual MySQL password:

```sh
export DB_HOST='127.0.0.1'
export DB_PORT='3306'
export DB_USER='root'
export DB_PASSWORD='replace-with-your-MySQL-password'
export DB_NAME='campus_atlas'
.venv/bin/python -m flask --app app run --host 127.0.0.1 --port 5000
```

Keep this terminal running. Open <http://127.0.0.1:5000/>. Press `Ctrl+C` in the terminal to stop the app. Repeat the exports when starting from a new terminal; the application does not itself load a `.env` file.

| Variable | Default in `app.py` | Purpose |
| --- | --- | --- |
| `DB_HOST` | `localhost` | MySQL server hostname |
| `DB_PORT` | `3306` | MySQL TCP port |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | Empty string | MySQL password |
| `DB_NAME` | `campus_atlas` | Existing database to connect to |
| `DB_SOCKET` | Unset | Optional Unix socket path, for a socket connection instead of TCP |
| `SECRET_KEY` | Random value on each app start | Flask session signing key; restarting without a fixed key requires signing in again |

Leave `DB_SOCKET` unset for the TCP setup above. If your installation requires a socket, set it to that server's actual socket path and use the matching `mysql --socket=...` connection when importing. Changing `DB_NAME` alone does not rename or create a database: the `CREATE DATABASE`/`USE` statements in the SQL scripts must also match a custom name.

### Windows PowerShell equivalent

Create the environment with `py -m venv .venv` and install dependencies with `.venv\Scripts\python.exe -m pip install -r requirements.txt`. PowerShell does not support the `<` import syntax above; open the MySQL client from the repository root, then run:

```sql
SOURCE database/db/schema.sql;
SOURCE database/db/seed.sql;
```

Set connection variables using PowerShell syntax, such as `$env:DB_USER = 'root'` and `$env:DB_PASSWORD = 'your-MySQL-password'`, with the other values matching the table above. Start with `.venv\Scripts\python.exe -m flask --app app run --host 127.0.0.1 --port 5000`. If the MySQL client is not on PATH, invoke its actual executable path with PowerShell's `&` operator.

## Demo accounts and pages

| Role | Email | Password |
| --- | --- | --- |
| Student | `student1@connect.hku.hk` | `student1` |
| Student | `student2@connect.hku.hk` | `student2` |
| Student | `student3@connect.hku.hk` | `student3` |
| Administrator | `admin1@connect.hku.hk` | `admin1` |
| Administrator | `admin2@connect.hku.hk` | `admin2` |

- `/`: public campus map; no login required.
- `/student`: student login, registration, facility reports and **My reports**. Choose **Create student account** to register with an `@connect.hku.hk` or `@hku.hk` address and a password of 8–128 characters. Registration checks the email domain and signs the student in immediately.
- `/admin`: administrator login, facility management, **Reports** and **History**.

These are seeded demonstration accounts. The app uses one login session per browser profile. To switch roles, sign out and sign in on the other role's page; two ordinary tabs share the same session. Separate browser profiles/private windows can be used for simultaneous student/admin demonstrations.

## Demonstrating the database workflow

These steps change the local demo data. The counts above describe the fresh seed, not the database after using the app.

1. **Read:** open `/`, filter by building or category, and select a facility to locate its building.
2. **Create a report:** sign in at `/student` as `student1`. Find the Main Library 1F printer and note its current status. Click **Report**, choose a different proposed status, and submit. Open **My reports**: the newest report should be `Pending`, while the facility retains its original status.
3. **Approve and update:** sign out, open `/admin`, and sign in as `admin1`. Click **Reports** and find the new pending report by its student, building, floor and proposed status (the seed already includes pending reports). Click **Approve** and confirm. The report becomes `Approved` and the facility takes the proposed status.
4. **Check history:** return to **Facilities** and open that facility's **History**. It should show the old/new status, approving administrator, reporting student and report ID. Refresh the public map or another open browser window to see the updated facility status; other tabs do not receive live updates.
5. **Reject:** submit another student report and reject it as an administrator. Its status becomes `Rejected`; the facility status and revision history stay unchanged.
6. **Delete a pending report:** as a student, submit a new report and withdraw it from **My reports** before review. This deletes that student's pending row from `reports`; approved/rejected reports cannot be withdrawn.
7. **Manage facilities:** as an administrator, use **+ Add facility** to create a demo facility, **Edit** to change it, and **Archive** to remove it from the public map. Archive is a soft delete (`archived=TRUE`); the row remains in MySQL.

Approval runs in one transaction: lock the pending report and its facility with `SELECT ... FOR UPDATE`, update `reports`, update `facilities`, and insert a `revisions` row. A failure rolls back the transaction. Each report can have at most one revision (`UNIQUE(reportID)`). Both decisions notify the reporting student. Approval expires older pending reports for the facility. Direct administrator status changes also appear in History.

## Project structure and database design

| Path | Contents |
| --- | --- |
| `app.py` | Flask routes, sessions, SQL queries and approval transaction |
| `requirements.txt` | Python dependencies |
| `templates/index.html` | Guest, student and administrator page template |
| `map-preview/campus.js`, `map-preview/campus.css` | Browser UI and map interactions |
| `map-preview/assets/` | Bundled HKU campus map assets |
| `map-preview/vendor/` | Leaflet and its license |
| `database/db/schema.sql` | Database, fourteen tables, keys and constraints |
| `database/db/seed.sql` | Demo accounts, facilities, reports and revisions |
| `database/db/queries.sql` | SQL examples; application SQL is in `app.py` |
| `database/ER_diagram.png` | ER diagram for the current schema |

`students` and `admins` reference `users`. Each facility belongs to one building and one category. Each report references a facility and a student, with a nullable reviewing administrator. Each revision identifies the facility and administrator. Report-driven revisions also reference the approved report.

The map uses Leaflet `CRS.Simple` with an 842 × 595 image. Building IDs match the map's printed building numbers. `buildings.map_x` and `map_y` are image coordinates measured from the top-left, not latitude/longitude. Facilities use their building's position.

Map source: [HKU Estates Office, April 2025](https://www.estates.hku.hk/download_file/view_inline/674). The bundled SVG was converted from the campus map PDF. See [map asset notes](map-preview/README.md) for provenance and the existing redistribution note.

## Troubleshooting

| Symptom | Check or fix |
| --- | --- |
| `command not found: mysql` | Use the actual client path or add its directory to PATH; see step 2. Python's virtual environment does not install MySQL. |
| `No module named 'pymysql'` / Flask cannot import `app` | Rerun `.venv/bin/python -m pip install -r requirements.txt`, then start with `.venv/bin/python -m flask --app app run`. A `(.venv)` prompt alone does not prove a bare `flask` command uses that interpreter. |
| `Can't connect to MySQL server` / connection refused | Check that the server is running and the app's host/port or socket matches the instance used for import. |
| `Access denied for user` | Check `DB_USER`, `DB_PASSWORD` and that account's MySQL permissions. Use the database password, not `admin1`. |
| `Unknown database` / table does not exist | Import schema then seed into the same MySQL instance and database that Flask uses. |
| `Table already exists` / duplicate key while importing | The scripts have already been run, or the database is not empty. Do not repeatedly import over it; use an initialized database or a separate clean instance. |
| Port 5000 is already in use | Start with `.venv/bin/python -m flask --app app run --port 5001` and open the printed URL. |
| Map loads but facilities do not | Check the Flask terminal for a database error and confirm the seed import succeeded. |
| The other role's controls appear | Sign out before switching between `/student` and `/admin`; tabs in the same browser profile share a session. |
