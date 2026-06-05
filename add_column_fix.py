import sqlite3
import os

db_path = r'c:\Users\pares\OneDrive\Desktop\2nd project1 (2)\2nd project1\2nd project1\2nd project\2nd project\backend\instance\smartrevise_v2.db'

if not os.path.exists(db_path):
    print(f"Database not found at: {db_path}")
else:
    print(f"Opening database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if 'progress' column exists
        cursor.execute("PRAGMA table_info(revisions)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'progress' not in columns:
            print("Adding 'progress' column to 'revisions' table...")
            cursor.execute("ALTER TABLE revisions ADD COLUMN progress INTEGER DEFAULT 0")
            print("Successfully added 'progress' column.")
        else:
            print("'progress' column already exists.")
            
        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
