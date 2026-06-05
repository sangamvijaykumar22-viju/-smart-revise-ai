
import sqlite3
import os

db_path = 'backend/instance/smartrevise_v2.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('SELECT email, reset_token FROM users')
users = cursor.fetchall()
for u in users:
    print(f"Email: {u[0]} | Token: {u[1]}")
conn.close()
