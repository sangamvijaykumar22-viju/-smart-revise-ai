from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Planner, User

planner_bp = Blueprint('planner', __name__, url_prefix='/api/planner')

@planner_bp.route('/add', methods=['POST'])
@jwt_required()
def add_task():
    """Add a new task to the user's planner."""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    if not data or not data.get('title') or not data.get('time'):
        return jsonify({"message": "Missing title or time"}), 400
        
    task = Planner(
        title=data['title'],
        description=data.get('description'),
        time=data['time'],
        date=data.get('date'),
        user_id=int(current_user_id)
    )
    
    try:
        db.session.add(task)
        db.session.commit()
        return jsonify({
            "message": "Task added successfuly",
            "task": task.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error adding task", "error": str(e)}), 500

@planner_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_tasks(user_id):
    """Fetch all planner tasks for a specific user ID."""
    current_user_id = int(get_jwt_identity())
    
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized access to these tasks"}), 403
        
    # Get the date from query params or default to today's date in 'YYYY-MM-DD' format
    requested_date = request.args.get('date')
    
    query = Planner.query.filter_by(user_id=user_id)
    if requested_date:
        query = query.filter_by(date=requested_date)
    
    tasks = query.order_by(Planner.time.asc()).all()
    return jsonify([task.to_dict() for task in tasks]), 200

@planner_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Delete a task from the planner."""
    current_user_id = int(get_jwt_identity())
    task = Planner.query.get(task_id)
    
    if not task:
        return jsonify({"message": "Task not found"}), 404
        
    if task.user_id != current_user_id:
        return jsonify({"message": "Unauthorized to delete this task"}), 403
        
    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error deleting task", "error": str(e)}), 500

@planner_bp.route('/<int:task_id>/toggle', methods=['PATCH', 'OPTIONS'])
def toggle_task(task_id):
    """Toggle the completion status of a task."""
    print(f"DEBUG: toggle_task request: {request.method} {request.path}")
    if request.method == 'OPTIONS':
        return '', 200
        
    return _do_toggle_task(task_id)

@jwt_required()
def _do_toggle_task(task_id):
    current_user_id = int(get_jwt_identity())
    task = Planner.query.get(task_id)
    
    if not task:
        return jsonify({"message": "Task not found"}), 404
        
    if task.user_id != current_user_id:
        return jsonify({"message": "Unauthorized to modify this task"}), 403
        
    try:
        task.completed = not task.completed
        db.session.commit()
        return jsonify({
            "message": "Task status updated",
            "task": task.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating task", "error": str(e)}), 500
