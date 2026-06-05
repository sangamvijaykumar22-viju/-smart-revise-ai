import os
import sys

# Add backend directory to sys.path to enable imports
backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Add parent directory of backend so we can do relative/package imports if needed
parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from flask import Flask
from backend.app import create_app
from backend.extensions import db
from backend.models import User, Revision, Planner, Chat, Message

def migrate():
    # Ensure we get the destination DATABASE_URL
    postgres_url = os.environ.get('TARGET_DATABASE_URL')
    if not postgres_url:
        print("Error: TARGET_DATABASE_URL environment variable is not set.")
        print("Please set TARGET_DATABASE_URL to your remote PostgreSQL connection string and try again.")
        print("Usage: python migrate_sqlite_to_postgres.py <TARGET_DATABASE_URL>")
        sys.exit(1)
    
    if postgres_url.startswith("postgres://"):
        postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)
        
    print("Starting migration process...")
    
    # 1. Initialize Flask app with local SQLite config
    local_app = create_app()
    
    with local_app.app_context():
        # Read everything from local SQLite
        print("Reading data from local SQLite database...")
        users = User.query.all()
        revisions = Revision.query.all()
        planners = Planner.query.all()
        chats = Chat.query.all()
        messages = Message.query.all()
        
        print(f"Loaded: {len(users)} users, {len(revisions)} revisions, {len(planners)} planners, {len(chats)} chats, {len(messages)} messages.")
    
    # 2. Re-create tables on remote PostgreSQL database
    print("Connecting to remote PostgreSQL database to create tables...")
    remote_app = Flask(__name__)
    remote_app.config['SQLALCHEMY_DATABASE_URI'] = postgres_url
    remote_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Re-initialize db with remote app
    db.init_app(remote_app)
    
    with remote_app.app_context():
        print("Creating tables on remote database if they do not exist...")
        db.create_all()
        
        # 1. Users
        print("Migrating users...")
        for u in users:
            if not User.query.get(u.id):
                new_u = User(
                    id=u.id,
                    username=u.username,
                    email=u.email,
                    password_hash=u.password_hash,
                    role=u.role,
                    is_active=u.is_active,
                    created_at=u.created_at,
                    last_login=u.last_login,
                    current_streak=u.current_streak,
                    reset_token=u.reset_token,
                    reset_token_expiry=u.reset_token_expiry
                )
                db.session.add(new_u)
        db.session.commit()
        
        # 2. Revisions
        print("Migrating revisions...")
        for r in revisions:
            if not Revision.query.get(r.id):
                new_r = Revision(
                    id=r.id,
                    topic=r.topic,
                    notes=r.notes,
                    language=r.language,
                    difficulty=r.difficulty,
                    accuracy=r.accuracy,
                    progress=r.progress,
                    user_id=r.user_id,
                    created_at=r.created_at
                )
                db.session.add(new_r)
        db.session.commit()
        
        # 3. Planners
        print("Migrating planners...")
        for p in planners:
            if not Planner.query.get(p.id):
                new_p = Planner(
                    id=p.id,
                    title=p.title,
                    description=p.description,
                    time=p.time,
                    date=p.date,
                    completed=p.completed,
                    user_id=p.user_id,
                    created_at=p.created_at
                )
                db.session.add(new_p)
        db.session.commit()
        
        # 4. Chats
        print("Migrating chats...")
        for c in chats:
            if not Chat.query.get(c.id):
                new_c = Chat(
                    id=c.id,
                    title=c.title,
                    user_id=c.user_id,
                    created_at=c.created_at
                )
                db.session.add(new_c)
        db.session.commit()
        
        # 5. Messages
        print("Migrating messages...")
        for m in messages:
            if not Message.query.get(m.id):
                new_m = Message(
                    id=m.id,
                    chat_id=m.chat_id,
                    role=m.role,
                    content=m.content,
                    created_at=m.created_at
                )
                db.session.add(new_m)
        db.session.commit()
        
        # Sync PostgreSQL primary key sequences to prevent duplicate key errors on future inserts
        print("Syncing PostgreSQL primary key sequences...")
        for table in ['users', 'revisions', 'planners', 'chats', 'messages']:
            try:
                db.session.execute(db.text(f"SELECT setval('{table}_id_seq', COALESCE((SELECT MAX(id)+1 FROM {table}), 1), false);"))
            except Exception as seq_err:
                print(f"Warning: Could not sync sequence for {table}: {seq_err}")
        db.session.commit()
        
    print("Migration completed successfully!")

if __name__ == '__main__':
    # Support passing database URL as CLI arg
    if len(sys.argv) > 1:
        os.environ['TARGET_DATABASE_URL'] = sys.argv[1]
    migrate()
