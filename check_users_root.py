
import os
import sys

# Add the current directory to sys.path so 'backend' can be found
sys.path.append(os.getcwd())

from backend.app import create_app
from backend.models import User

app = create_app()
with app.app_context():
    users = User.query.all()
    print("Listing all users:")
    for u in users:
        # Check for jagruth specifically
        if u.username and u.username.lower() == 'jagruth':
            print(f">>> FOUND: Username: {u.username}, Email: {u.email}")
        else:
            print(f"Username: {u.username}, Email: {u.email}")
