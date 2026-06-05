from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta
from ..extensions import db
from ..models import User, Revision, Chat, Message, Planner
from ..utils.admin_auth import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def platform_stats():
    """Get platform-wide statistics for the admin dashboard."""
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    # Core counts
    total_users = User.query.count()
    total_revisions = Revision.query.count()
    total_chats = Chat.query.count()
    total_messages = Message.query.count()
    total_planners = Planner.query.count()

    # Active users in last 7 days
    active_7d = User.query.filter(User.last_login >= seven_days_ago).count()

    # New users in last 7 days
    new_users_7d = User.query.filter(User.created_at >= seven_days_ago).count()

    # New users in last 30 days
    new_users_30d = User.query.filter(User.created_at >= thirty_days_ago).count()

    # Registration trend (last 7 days, day by day)
    registration_trend = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = User.query.filter(User.created_at >= day_start, User.created_at < day_end).count()
        registration_trend.append({
            "date": day_start.strftime('%b %d'),
            "count": count
        })

    # Top topics (most revised)
    top_topics_query = db.session.query(
        Revision.topic, db.func.count(Revision.id).label('count')
    ).group_by(Revision.topic).order_by(db.func.count(Revision.id).desc()).limit(8).all()
    top_topics = [{"topic": t[0], "count": t[1]} for t in top_topics_query]

    # Top languages
    top_languages_query = db.session.query(
        Revision.language, db.func.count(Revision.id).label('count')
    ).filter(Revision.language.isnot(None)).group_by(Revision.language).order_by(
        db.func.count(Revision.id).desc()
    ).limit(5).all()
    top_languages = [{"language": l[0], "count": l[1]} for l in top_languages_query]

    return jsonify({
        "total_users": total_users,
        "total_revisions": total_revisions,
        "total_chats": total_chats,
        "total_messages": total_messages,
        "total_planners": total_planners,
        "active_users_7d": active_7d,
        "new_users_7d": new_users_7d,
        "new_users_30d": new_users_30d,
        "registration_trend": registration_trend,
        "top_topics": top_topics,
        "top_languages": top_languages
    }), 200


@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """Get all users with pagination and search."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    search = request.args.get('search', '', type=str)
    sort_by = request.args.get('sort', 'created_at', type=str)
    order = request.args.get('order', 'desc', type=str)

    query = User.query

    # Search filter
    if search:
        query = query.filter(
            db.or_(
                User.username.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )

    # Sorting
    sort_column = getattr(User, sort_by, User.created_at)
    if order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    users = query.paginate(page=page, per_page=per_page, error_out=False)

    # Add revision count for each user
    user_list = []
    for u in users.items:
        user_data = u.to_dict()
        user_data['revision_count'] = Revision.query.filter_by(user_id=u.id).count()
        user_data['chat_count'] = Chat.query.filter_by(user_id=u.id).count()
        user_list.append(user_data)

    return jsonify({
        "users": user_list,
        "total": users.total,
        "pages": users.pages,
        "current_page": users.page,
        "per_page": per_page
    }), 200


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user_detail(user_id):
    """Get detailed information about a specific user."""
    user = User.query.get_or_404(user_id)
    user_data = user.to_dict()
    user_data['revisions'] = [r.to_dict() for r in Revision.query.filter_by(user_id=user.id).order_by(Revision.created_at.desc()).limit(20).all()]
    user_data['revision_count'] = Revision.query.filter_by(user_id=user.id).count()
    user_data['chat_count'] = Chat.query.filter_by(user_id=user.id).count()
    user_data['planner_count'] = Planner.query.filter_by(user_id=user.id).count()
    return jsonify(user_data), 200


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user and all their associated data (cascade)."""
    current_admin_id = int(get_jwt_identity())

    # Prevent self-deletion
    if user_id == current_admin_id:
        return jsonify({"message": "You cannot delete your own admin account"}), 400

    user = User.query.get_or_404(user_id)
    username = user.username

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": f"User '{username}' and all associated data deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error deleting user", "error": str(e)}), 500


@admin_bp.route('/users/<int:user_id>/toggle-role', methods=['PATCH'])
@admin_required
def toggle_role(user_id):
    """Toggle a user's role between 'user' and 'admin'."""
    current_admin_id = int(get_jwt_identity())

    if user_id == current_admin_id:
        return jsonify({"message": "You cannot change your own role"}), 400

    user = User.query.get_or_404(user_id)
    user.role = 'admin' if user.role == 'user' else 'user'

    try:
        db.session.commit()
        return jsonify({
            "message": f"User '{user.username}' role updated to '{user.role}'",
            "user": user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating role", "error": str(e)}), 500


@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['PATCH'])
@admin_required
def toggle_status(user_id):
    """Enable or disable a user account."""
    current_admin_id = int(get_jwt_identity())

    if user_id == current_admin_id:
        return jsonify({"message": "You cannot disable your own account"}), 400

    user = User.query.get_or_404(user_id)
    user.is_active = not user.is_active

    try:
        db.session.commit()
        status = "activated" if user.is_active else "deactivated"
        return jsonify({
            "message": f"User '{user.username}' has been {status}",
            "user": user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating status", "error": str(e)}), 500


@admin_bp.route('/users/<int:user_id>/reset-password', methods=['PATCH'])
@admin_required
def admin_reset_password(user_id):
    """Admin forcefully resets a user's password. New password is bcrypt-hashed."""
    data = request.get_json()
    new_password = data.get('new_password', '').strip() if data else ''

    if not new_password or len(new_password) < 6:
        return jsonify({"message": "New password must be at least 6 characters"}), 400

    user = User.query.get_or_404(user_id)

    try:
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": f"Password for '{user.username}' has been reset successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error resetting password", "error": str(e)}), 500


@admin_bp.route('/revisions', methods=['GET'])
@admin_required
def list_revisions():
    """Get all revisions across the platform with pagination."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)

    revisions = Revision.query.order_by(Revision.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    revision_list = []
    for r in revisions.items:
        rev_data = r.to_dict()
        owner = User.query.get(r.user_id)
        rev_data['owner_username'] = owner.username if owner else 'Deleted User'
        revision_list.append(rev_data)

    return jsonify({
        "revisions": revision_list,
        "total": revisions.total,
        "pages": revisions.pages,
        "current_page": revisions.page
    }), 200


@admin_bp.route('/revisions/<int:revision_id>', methods=['DELETE'])
@admin_required
def delete_revision(revision_id):
    """Delete a specific revision."""
    revision = Revision.query.get_or_404(revision_id)
    try:
        db.session.delete(revision)
        db.session.commit()
        return jsonify({"message": "Revision deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error deleting revision", "error": str(e)}), 500


@admin_bp.route('/recent-activity', methods=['GET'])
@admin_required
def recent_activity():
    """Get recent platform activity (logins, registrations, revisions)."""
    limit = request.args.get('limit', 20, type=int)

    # Recent registrations
    recent_users = User.query.order_by(User.created_at.desc()).limit(limit).all()
    registrations = [{
        "type": "registration",
        "username": u.username,
        "timestamp": u.created_at.isoformat(),
        "detail": f"{u.username} registered"
    } for u in recent_users]

    # Recent logins
    recent_logins = User.query.filter(User.last_login.isnot(None)).order_by(User.last_login.desc()).limit(limit).all()
    logins = [{
        "type": "login",
        "username": u.username,
        "timestamp": u.last_login.isoformat(),
        "detail": f"{u.username} logged in"
    } for u in recent_logins]

    # Recent revisions
    recent_revs = Revision.query.order_by(Revision.created_at.desc()).limit(limit).all()
    revisions = []
    for r in recent_revs:
        owner = User.query.get(r.user_id)
        revisions.append({
            "type": "revision",
            "username": owner.username if owner else "Unknown",
            "timestamp": r.created_at.isoformat(),
            "detail": f"{owner.username if owner else 'Unknown'} generated revision on '{r.topic}'"
        })

    # Merge and sort all activities by timestamp
    all_activity = registrations + logins + revisions
    all_activity.sort(key=lambda x: x['timestamp'], reverse=True)

    return jsonify({"activities": all_activity[:limit]}), 200
