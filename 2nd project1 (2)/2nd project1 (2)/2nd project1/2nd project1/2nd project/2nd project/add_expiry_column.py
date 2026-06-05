import os
import sys
import sqlite3

# Add current directory to path
sys.path.append(os.getcwd())

from backend.config import Config

def add_reset_token_expiry_column():
    # Parse the SQLite path from the config
    db_uri = Config.SQLALCHEMY_DATABASE_URI
    if not db_uri.startswith('sqlite:///'):
        print(f"Unsupported DB URI for manual migration: {db_uri}")
        return

    # Handle path translation from URI to filesystem path
    db_path = db_uri.replace('sqlite:///', '')
    
    # On Windows, if URI is sqlite:///C:/path, db_path becomes C:/path
    # Usually no extra slash manipulation needed if it's already absolute
    
    print(f"Connecting to database at: {db_path}")
    
    if not os.path.exists(db_path):
        # Retry with forward slash to backward slash conversion for windows
        db_path = db_path.replace('/', os.sep)
        if not os.path.exists(db_path):
            print(f"Database file not found at {db_path}")
            return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'reset_token_expiry' not in columns:
            print("Adding reset_token_expiry column to users table...")
            # Adding as DATETIME
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME")
            conn.commit()
            print("Column 'reset_token_expiry' added successfully.")
        else:
            print("Column 'reset_token_expiry' already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Error during manual migration: {e}")

if __name__ == "__main__":
    add_reset_token_expiry_column()
