import sys
import os
# Add current directory to path
sys.path.append(os.getcwd())

try:
    from backend.app import create_app
    from backend.extensions import db
    from sqlalchemy import inspect
    
    app = create_app()
    with app.app_context():
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"Current Tables: {tables}")
        
        if 'chats' not in tables:
            print("Chat table missing. Creating all tables...")
            db.create_all()
            print("Tables created successfully.")
            tables = inspector.get_table_names()
            print(f"Updated Tables: {tables}")
        else:
            print("Chat table already exists.")
except Exception as e:
    print(f"Error during migration: {e}")
    import traceback
    traceback.print_exc()
