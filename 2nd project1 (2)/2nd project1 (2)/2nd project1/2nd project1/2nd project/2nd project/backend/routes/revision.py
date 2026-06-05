import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Revision, User
from ..utils.openai_service import OpenAIService

revision_bp = Blueprint('revision', __name__, url_prefix='/api/revision')
openai_service = OpenAIService()

@revision_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_revision():
    """Generates revision content while avoiding duplicate questions."""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    if not data or not data.get('topic'):
        return jsonify({"message": "Topic is required"}), 400
        
    topic = data.get('topic')
    language = data.get('language', 'Universal')
    difficulty = data.get('difficulty', 'Intermediate')

    # Fetch History to avoid duplicates
    history = []
    try:
        previous_revisions = Revision.query.filter_by(
            user_id=int(current_user_id), 
            topic=topic
        ).order_by(Revision.created_at.desc()).limit(5).all()
        
        for rev in previous_revisions:
            try:
                # Revisions store the whole AI JSON in the 'notes' field
                rev_content = json.loads(rev.notes)
                if 'mcqs' in rev_content:
                    for m in rev_content['mcqs']:
                        history.append(f"MCQ: {m.get('question', '')[:50]}...")
                if 'coding_practice' in rev_content:
                    prob = rev_content['coding_practice'].get('real_life_problem', {})
                    history.append(f"Problem: {prob.get('title', '')}")
            except:
                continue
    except Exception as e:
        print(f"Error fetching history: {e}")

    try:
        content = openai_service.generate_revision_content(topic, language, difficulty, history=history)
        
        if not content:
            return jsonify({"message": "Failed to generate content from AI"}), 500
        
        if isinstance(content, dict) and "error" in content:
            return jsonify(content), 500
            
        return jsonify(content), 200
    except Exception as e:
        import traceback
        error_msg = str(e)
        trace = traceback.format_exc()
        print(f"!!! GENERATION CRASH: {error_msg}")
        print(trace)
        return jsonify({
            "message": "Internal Server Error during generation",
            "error": error_msg,
            "traceback": trace
        }), 500

@revision_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat_response():
    """Generates a conversational AI response for the chatbot UI."""
    data = request.get_json()
    
    if not data or not data.get('messages'):
        return jsonify({"message": "Messages history is required"}), 400
        
    messages = data.get('messages')
    response = openai_service.generate_chat_response(messages)
    
    if not response:
        return jsonify({"message": "Failed to get AI response"}), 500
        
    return jsonify({"response": response}), 200

@revision_bp.route('/save', methods=['POST'])
@jwt_required()
def save_revision():
    """Save a new AI-generated revision for the logged-in user."""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    if not data or not data.get('topic') or not data.get('notes'):
        return jsonify({"message": "Missing topic or notes"}), 400
        
    revision = Revision(
        topic=data['topic'],
        notes=data['notes'],
        language=data.get('language'),
        difficulty=data.get('difficulty'),
        accuracy=data.get('accuracy', '0%'),
        progress=data.get('progress', 0),
        user_id=int(current_user_id)
    )
    
    try:
        db.session.add(revision)
        db.session.commit()
        return jsonify({
            "message": "Revision saved successfully",
            "revision": revision.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error saving revision", "error": str(e)}), 500

@revision_bp.route('/<int:revision_id>', methods=['PATCH'])
@jwt_required()
def update_revision(revision_id):
    """Partially update a revision (accuracy/progress) in real-time."""
    data = request.get_json()
    current_user_id = int(get_jwt_identity())
    revision = Revision.query.get(revision_id)
    
    if not revision:
        return jsonify({"message": "Revision not found"}), 404
        
    if revision.user_id != current_user_id:
        return jsonify({"message": "Unauthorized"}), 403
        
    if 'accuracy' in data:
        revision.accuracy = data['accuracy']
    if 'progress' in data:
        revision.progress = data['progress']
        
    try:
        db.session.commit()
        return jsonify(revision.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Update failed", "error": str(e)}), 500

@revision_bp.route('/<int:revision_id>', methods=['GET'])
@jwt_required()
def get_revision(revision_id):
    """Fetch a specific revision by ID. Security check ensures user can only access their own."""
    current_user_id = int(get_jwt_identity())
    revision = Revision.query.get(revision_id)
    
    if not revision:
        return jsonify({"message": "Revision not found"}), 404
        
    if revision.user_id != current_user_id:
        return jsonify({"message": "Unauthorized access to this revision"}), 403
        
    return jsonify(revision.to_dict()), 200

@revision_bp.route('/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_revisions(user_id):
    """Fetch all revisions for a specific user ID. Security check ensures user can only access their own."""
    current_user_id = int(get_jwt_identity())
    
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized access to these revisions"}), 403
        
    revisions = Revision.query.filter_by(user_id=user_id).order_by(Revision.created_at.desc()).all()
    return jsonify([rev.to_dict() for rev in revisions]), 200

@revision_bp.route('/<int:revision_id>', methods=['DELETE'])
@jwt_required()
def delete_revision(revision_id):
    """Delete a specific revision if owned by the current user."""
    current_user_id = int(get_jwt_identity())
    revision = Revision.query.get(revision_id)
    
    if not revision:
        return jsonify({"message": "Revision not found"}), 404
        
    if revision.user_id != current_user_id:
        return jsonify({"message": "Unauthorized to delete this revision"}), 403
        
    try:
        db.session.delete(revision)
        db.session.commit()
        return jsonify({"message": "Revision deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error deleting revision", "error": str(e)}), 500
