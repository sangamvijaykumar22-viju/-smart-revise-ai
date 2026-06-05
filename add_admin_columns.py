"""
Migration script to add 'role' and 'is_active' columns to the users table.
Run this ONCE after updating models.py.
"""
import sqlite3
import os

# Path to your SQLite database
db_path = os.path.join(os.path.dirname(__file__), 'backend', 'instance', 'smartrevise.db')

if not os.path.exists(db_path):
    print(f"Database not found at: {db_path}")
    print("Searching for database file...")
    for root, dirs, files in os.walk(os.path.join(os.path.dirname(__file__), 'backend')):
        for f in files:
            if f.endswith('.db'):
                db_path = os.path.join(root, f)
                print(f"Found database at: {db_path}")
                break

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check existing columns
cursor.execute("PRAGMA table_info(users)")
columns = [col[1] for col in cursor.fetchall()]
print(f"Current columns: {columns}")

# Add 'role' column if it doesn't exist
if 'role' not in columns:
    cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL")
    print("[OK] Added 'role' column")
else:
    print("[INFO] 'role' column already exists")

# Add 'is_active' column if it doesn't exist
if 'is_active' not in columns:
    cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL")
    print("[OK] Added 'is_active' column")
else:
    print("[INFO] 'is_active' column already exists")

conn.commit()

# Verify
cursor.execute("PRAGMA table_info(users)")
columns = [col[1] for col in cursor.fetchall()]
print(f"\nUpdated columns: {columns}")

conn.close()
print("\nMigration complete!")
