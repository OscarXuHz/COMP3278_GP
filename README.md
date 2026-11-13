# Campus Atlas

Use Python 3.9+ and MySQL 8+. From the repository root, initialize an empty development database and start Flask:

```sh
mysql -u root -p < database/db/schema.sql
mysql -u root -p < database/db/seed.sql
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
flask --app app run
```

Set DB_USER, DB_PASSWORD and optionally DB_HOST, DB_PORT or DB_SOCKET for the local MySQL account. Use DB_NAME to override campus_atlas. Open the URL printed by Flask. Use a fresh development database for the schema and seed scripts; they are not migrations.

Browse buildings and categories as a guest. Open `/admin` and sign in with the demo admin account `admin1@connect.hku.hk` / `admin1` to add, edit or archive a facility. The map uses the printed building number and top-left X/Y coordinates on an 842 × 595 image. Archived facilities are retained in MySQL and hidden from the map.
