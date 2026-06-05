from datetime import datetime
from .extensions import db, bcrypt

class User(db.Model):
    """User model for storing authentication details."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)  # 'user' or 'admin'
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    current_streak = db.Column(db.Integer, default=1)
    reset_token = db.Column(db.String(10), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    revisions = db.relationship('Revision', backref='owner', lazy=True, cascade="all, delete-orphan")
    planners = db.relationship('Planner', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        """Hashes the password using Bcrypt."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        """Checks the password against the stored hash."""
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Serializes user object for JSON responses."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "current_streak": self.current_streak
        }

class Revision(db.Model):
    """Model to store AI-generated revision content."""
    __tablename__ = 'revisions'
    
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(255), nullable=False)
    notes = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(50), nullable=True)
    difficulty = db.Column(db.String(50), nullable=True)
    accuracy = db.Column(db.String(20), nullable=True)
    progress = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Serializes revision object for JSON responses."""
        return {
            "id": self.id,
            "topic": self.topic,
            "notes": self.notes,
            "language": self.language,
            "difficulty": self.difficulty,
            "accuracy": self.accuracy,
            "progress": self.progress,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat()
        }

class Planner(db.Model):
    """Model to store user tasks and schedule."""
    __tablename__ = 'planners'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    time = db.Column(db.String(100), nullable=False) # e.g., "10:00 AM" or ISO string
    date = db.Column(db.String(50), nullable=True) # e.g., "2026-03-08"
    completed = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "time": self.time,
            "date": self.date,
            "completed": self.completed,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat()
        }

class Chat(db.Model):
    """Model to store user chat conversations."""
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', backref='chat', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "messages": [m.to_dict() for m in self.messages]
        }

class Message(db.Model):
    """Model to store individual messages within a chat."""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "chat_id": self.chat_id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat()
        }
