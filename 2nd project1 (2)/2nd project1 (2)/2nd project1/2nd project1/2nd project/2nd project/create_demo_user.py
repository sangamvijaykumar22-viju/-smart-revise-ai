
import os
import sys
from backend.app import create_app
from backend.extensions import db
from backend.models import User

def create_demo_user():
    app = create_app()
    with app.app_context():
        email = "demo@smartrevise.ai"
        username = "DemoUser"
        password = "Password123"
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            # Update password of existing demo user
            existing_user.set_password(password)
            db.session.commit()
            print(f"Updated existing user: {email}")
        else:
            # Create new user
            user = User(username=username, email=email)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            print(f"Created new user: {email}")
            
        print(f"Credentials:\nEmail: {email}\nPassword: {password}")

if __name__ == "__main__":
    create_demo_user()
