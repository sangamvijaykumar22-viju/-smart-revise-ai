import os
import sys
import sqlite3

# Add current directory to path
sys.path.append(os.getcwd())

from backend.config import Config

def add_reset_token_column():
    # Parse the SQLite path from the config
    db_uri = Config.SQLALCHEMY_DATABASE_URI
    if not db_uri.startswith('sqlite:///'):
        print(f"Unsupported DB URI for manual migration: {db_uri}")
        return

    db_path = db_uri.replace('sqlite:///', '')
    # Handle absolute paths on Windows if needed
    if db_path.startswith('/'):
        # On windows, /c:/ becomes c:/
        if db_path[2] == ':':
            db_path = db_path[1:]

    print(f"Connecting to database at: {db_path}")
    
    if not os.path.exists(db_path):
        print("Database file not found.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'reset_token' not in columns:
            print("Adding reset_token column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR(10)")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column 'reset_token' already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Error during manual migration: {e}")

if __name__ == "__main__":
    add_reset_token_column()
