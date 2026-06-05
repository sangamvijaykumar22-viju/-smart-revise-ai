
from backend.app import create_app
from backend.extensions import db
from backend.models import User

app = create_app()
with app.app_context():
    users = User.query.all()
    print("Listing all users:")
    for u in users:
        print(f"Username: {u.username}, Email: {u.email}")
