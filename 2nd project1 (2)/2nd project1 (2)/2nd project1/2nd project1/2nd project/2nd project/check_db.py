from backend.extensions import db
from backend.models import User, Revision
from flask import Flask
import os

app = Flask(__name__)
# Try to find the correct DB path
db_path = os.path.join(os.getcwd(), 'instance', 'smart_revise.db')
if not os.path.exists(db_path):
    db_path = os.path.join(os.getcwd(), 'backend', 'smart_revise.db')

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
db.init_app(app)

with app.app_context():
    user = User.query.filter_by(username='paresh').first()
    if user:
        print(f"User: {user.username} (ID: {user.id})")
        print(f"Revisions count: {len(user.revisions)}")
        for i, rev in enumerate(user.revisions[:5]):
            print(f"  {i+1}. {rev.topic} - {rev.accuracy}")
    else:
        print("User 'paresh' not found.")
