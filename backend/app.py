from flask import Flask, jsonify, request
from .config import Config
from .extensions import db, jwt, bcrypt, mail
from .routes.auth import auth_bp
from .routes.revision import revision_bp
from .routes.planner import planner_bp
from flask_cors import CORS
from .routes.upload import upload_bp
from .routes.chat import chat_bp
from .routes.admin import admin_bp
from .utils.scheduler import start_scheduler

def create_app(config_class=Config):
    """Application factory for SmartRevise AI Backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    
    @app.before_request
    def log_request():
        print(f"INCOMING REQUEST: {request.method} {request.path}")
    
    # Configure SQLite for better concurrency
    with app.app_context():
        if "sqlite" in app.config['SQLALCHEMY_DATABASE_URI']:
            from sqlalchemy import event
            @event.listens_for(db.engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA synchronous=NORMAL")
                cursor.execute("PRAGMA busy_timeout=5000") # 5 seconds
                cursor.close()

    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)
    
    # Initialize CORS properly - allow PATCH and other common methods
    CORS(app, resources={r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }})
    
    # Start Background Scheduler for reminders
    start_scheduler(app)

    # Global Error Handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle all unhandled exceptions and return JSON with CORS."""
        from werkzeug.exceptions import HTTPException
        import traceback
        
        # Initialize response
        if isinstance(e, HTTPException):
            response = jsonify({
                "message": e.description,
                "error": str(e),
                "type": e.__class__.__name__
            })
            response.status_code = e.code
        else:
            error_msg = str(e)
            stack_trace = traceback.format_exc()
            print(f"!!! CRITICAL SERVER ERROR: {error_msg}")
            print(stack_trace)
            
            # Rollback any pending database changes
            try:
                db.session.rollback()
            except:
                pass
                
            response = jsonify({
                "message": "Internal Server Error",
                "error": error_msg,
                "type": e.__class__.__name__
            })
            response.status_code = 500
        
        # Manually add CORS headers to error responses to prevent browser blockages
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response

    # Health check route
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "service": "SmartRevise AI Backend"}), 200

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(revision_bp)
    app.register_blueprint(planner_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(admin_bp)

    # Create database tables automatically
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    # Running on port 5050 in debug mode for development
    app.run(debug=True, port=5050)
