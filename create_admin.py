"""
Script to create or promote an admin user.
Run this ONCE to set up your first admin account.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from backend.app import create_app
from backend.extensions import db
from backend.models import User

app = create_app()

with app.app_context():
    # Change these credentials as needed
    ADMIN_EMAIL = 'admin@smartrevise.com'
    ADMIN_USERNAME = 'admin'
    ADMIN_PASSWORD = 'Admin@123'

    admin = User.query.filter_by(email=ADMIN_EMAIL).first()

    if not admin:
        admin = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            role='admin',
            is_active=True
        )
        admin.set_password(ADMIN_PASSWORD)
        from datetime import datetime
        admin.last_login = datetime.utcnow()

        db.session.add(admin)
        db.session.commit()
        print("[OK] Admin user created!")
        print(f"   Email: {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
    else:
        admin.role = 'admin'
        db.session.commit()
        print(f"[OK] Existing user '{admin.username}' promoted to admin!")
        print(f"   Email: {admin.email}")

    print("\nLogin at the admin portal with these credentials.")
