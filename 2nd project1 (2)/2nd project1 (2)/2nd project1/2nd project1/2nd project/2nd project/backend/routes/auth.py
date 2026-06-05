from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
from ..extensions import db
from ..models import User
from ..utils.mail_service import send_welcome_email, send_password_reset_email, send_login_alert_email
import secrets

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user with email uniqueness validation."""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Missing required fields"}), 400
        
    # Check for duplicate email or username
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already exists"}), 409
        
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"message": "Username already exists"}), 409
        
    # Create new user
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    user.last_login = datetime.utcnow() # Initialize last_login on registration
    
    try:
        db.session.add(user)
        db.session.commit()
        
        # Send welcome email asynchronously
        send_welcome_email(user.email, user.username)
        
        return jsonify({
            "message": "User registered successfully",
            "user": user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error registering user", "error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user, update streak, and return a JWT access token."""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Missing email or password"}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.check_password(data['password']):
        now = datetime.utcnow()
        if user.last_login:
            diff = now.date() - user.last_login.date()
            if diff.days == 1:
                user.current_streak += 1
            elif diff.days > 1:
                user.current_streak = 1
        else:
            user.current_streak = 1
            
        user.last_login = now
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": "Error updating user session", "error": str(e)}), 500
            
        # Send login alert asynchronously
        send_login_alert_email(user.email, user.username)
        
        # Generate JWT token
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": user.to_dict()
        }), 200
        
    return jsonify({"message": "Invalid email or password"}), 401

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    """Example of a protected route using @jwt_required()."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    return jsonify(user.to_dict()), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request a password reset email."""
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({"message": "Email is required"}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    if user:
        # Generate a secure 8-character token
        reset_token = secrets.token_hex(4).upper() 
        user.reset_token = reset_token
        
        # Set expiry to 1 hours from now
        from datetime import timedelta
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        
        try:
            db.session.commit()
            send_password_reset_email(user.email, reset_token)
        except Exception as e:
            db.session.rollback()
            print(f"Error saving reset token: {e}")
        
    return jsonify({"message": "If that email exists in our system, a reset code has been sent."}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Verify reset token and update password."""
    data = request.get_json()
    if not data or not data.get('email') or not data.get('token') or not data.get('new_password'):
        return jsonify({"message": "Missing required fields"}), 400
        
    user = User.query.filter_by(email=data['email'], reset_token=data['token']).first()
    
    if not user:
        return jsonify({"message": "Invalid email or reset token"}), 400
        
    # Check for expiry
    if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        return jsonify({"message": "Reset token has expired. Please request a new one."}), 400
        
    try:
        user.set_password(data['new_password'])
        # Clear token and expiry after successful reset
        user.reset_token = None 
        user.reset_token_expiry = None
        db.session.commit()
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating password", "error": str(e)}), 500

