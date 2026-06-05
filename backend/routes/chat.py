from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from ..extensions import db
from ..models import Chat, Message, User
from ..utils.openai_service import OpenAIService
from ..utils.file_utils import extract_text

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')
openai_service = OpenAIService()

@chat_bp.route('/list', methods=['GET'])
@jwt_required()
def list_chats():
    """Fetch all chats for the logged-in user."""
    current_user_id = int(get_jwt_identity())
    chats = Chat.query.filter_by(user_id=current_user_id).order_by(Chat.created_at.desc()).all()
    # Simplified to_dict for list (no full messages)
    return jsonify([{
        "id": c.id,
        "title": c.title,
        "created_at": c.created_at.isoformat()
    } for c in chats]), 200

@chat_bp.route('/<int:chat_id>', methods=['GET'])
@jwt_required()
def get_chat(chat_id):
    """Fetch full chat history for a specific chat."""
    current_user_id = int(get_jwt_identity())
    chat = Chat.query.get(chat_id)
    
    if not chat:
        return jsonify({"message": "Chat not found"}), 404
        
    if chat.user_id != current_user_id:
        return jsonify({"message": "Unauthorized access to this chat"}), 403
        
    return jsonify(chat.to_dict()), 200

@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def add_message():
    # Handle both JSON and Multipart/Form-Data
    if request.is_json:
        data = request.get_json()
        content = data.get('content')
        chat_id = data.get('chat_id')
    else:
        # Multipart (FormData)
        content = request.form.get('content')
        chat_id = request.form.get('chat_id')
        if chat_id: chat_id = int(chat_id)

    current_user_id = int(get_jwt_identity())
    
    if not content and 'file' not in request.files:
        return jsonify({"message": "Content or file is required"}), 400
        
    # Process File if present
    file_context = ""
    if 'file' in request.files:
        file = request.files['file']
        if file:
            text = extract_text(file, file.filename)
            if text:
                file_context = f"\n\n[Context from attached file '{file.filename}':]\n{text[:5000]}" # Limit context
                if not content:
                    content = f"I've attached a file named {file.filename}. Please analyze it."
    
    # Final content sent to AI (visible in DB)
    full_content = content + file_context if file_context else content
    
    chat = None
    if chat_id:
        chat = Chat.query.get(chat_id)
        if not chat or chat.user_id != current_user_id:
            return jsonify({"message": "Invalid chat ID"}), 403
    else:
        # Create new chat
        title = content[:30] + ('...' if len(content) > 30 else '')
        chat = Chat(title=title, user_id=current_user_id)
        db.session.add(chat)
        db.session.flush() # Get ID before commit
        
    # Add user message
    print(f"[DEBUG] Adding user message to chat {chat.id}")
    user_msg = Message(chat_id=chat.id, role='user', content=full_content)
    db.session.add(user_msg)
    
    try:
        db.session.flush()
        print("[DEBUG] User message flushed")
    except Exception as e:
        db.session.rollback()
        print(f"[DEBUG] Flush failed: {str(e)}")
        return jsonify({"message": "Error saving user message", "error": str(e)}), 500
    
    # Get AI response
    try:
        print("[DEBUG] Requesting AI response...")
        history = Message.query.filter_by(chat_id=chat.id).order_by(Message.created_at.asc()).all()
        messages = [{"role": m.role, "content": m.content} for m in history]
        
        ai_response_text = openai_service.generate_chat_response(messages)
        print(f"[DEBUG] AI Response received (length: {len(ai_response_text) if ai_response_text else 0})")
        
        if not ai_response_text:
            raise Exception("AI service returned no content")
            
        # Add AI message
        ai_msg = Message(chat_id=chat.id, role='assistant', content=ai_response_text)
        db.session.add(ai_msg)
        db.session.commit()
        print("[DEBUG] AI message committed")
        
        return jsonify({
            "chat_id": chat.id,
            "response": ai_response_text,
            "title": chat.title
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"[-] Chat Response Error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "message": "AI Generation Error",
            "error": str(e)
        }), 500

@chat_bp.route('/message/stream', methods=['POST'])
@jwt_required()
def add_message_stream():
    """Streaming version of the chat endpoint."""
    data = request.get_json()
    content = data.get('content')
    chat_id = data.get('chat_id')
    current_user_id = int(get_jwt_identity())
    
    if not content:
        return jsonify({"message": "Content is required"}), 400
        
    chat = None
    if chat_id:
        chat = Chat.query.get(chat_id)
        if not chat or chat.user_id != current_user_id:
            return jsonify({"message": "Invalid chat ID"}), 403
    else:
        title = content[:30] + ('...' if len(content) > 30 else '')
        chat = Chat(title=title, user_id=current_user_id)
        db.session.add(chat)
        db.session.commit()
    
    # Save user message
    user_msg = Message(chat_id=chat.id, role='user', content=content)
    db.session.add(user_msg)
    db.session.commit()

    # Query history now while request context and database session are fully active
    history = Message.query.filter_by(chat_id=chat.id).order_by(Message.created_at.asc()).all()
    messages = [{"role": m.role, "content": m.content} for m in history]
    chat_id_val = chat.id
    chat_title_val = chat.title

    def generate():
        full_response = ""
        # Yield metadata first (like chat_id)
        yield f"METADATA:{json.dumps({'chat_id': chat_id_val, 'title': chat_title_val})}\n"
        
        for chunk in openai_service.generate_chat_stream(messages):
            full_response += chunk
            yield chunk
            
        # After stream ends, save AI message to DB
        from flask import current_app
        with current_app.app_context():
            new_ai_msg = Message(chat_id=chat_id_val, role='assistant', content=full_response)
            db.session.add(new_ai_msg)
            db.session.commit()

    from flask import Response
    return Response(generate(), mimetype='text/event-stream')

@chat_bp.route('/<int:chat_id>', methods=['DELETE'])
@jwt_required()
def delete_chat(chat_id):
    """Delete a specific chat."""
    current_user_id = int(get_jwt_identity())
    chat = Chat.query.get(chat_id)
    
    if not chat:
        return jsonify({"message": "Chat not found"}), 404
        
    if chat.user_id != current_user_id:
        return jsonify({"message": "Unauthorized to delete this chat"}), 403
        
    try:
        db.session.delete(chat)
        db.session.commit()
        return jsonify({"message": "Chat deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error deleting chat", "error": str(e)}), 500
