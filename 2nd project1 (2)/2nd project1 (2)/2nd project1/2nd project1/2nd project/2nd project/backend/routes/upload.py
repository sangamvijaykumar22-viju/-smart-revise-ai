import io
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import PyPDF2
from ..utils.openai_service import OpenAIService

upload_bp = Blueprint('upload', __name__, url_prefix='/api')
openai_service = OpenAIService()

from ..utils.file_utils import extract_text

@upload_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """Handles PDF, DOCX, and TXT upload, extracts text, and generates structured revision via OpenAI."""
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
    
    file = request.files['file']
    language = request.form.get('language', 'Universal')
    difficulty = request.form.get('difficulty', 'Intermediate')
    
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
    
    allowed_extensions = {'.docx', '.txt'}
    if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        return jsonify({"message": "Only DOCX and TXT files are allowed"}), 400
    
    # Process file in memory
    extracted_text = extract_text(file, file.filename)
    
    if not extracted_text:
        return jsonify({"message": "Failed to extract text from file"}), 500
    
    # Limit text size to avoid token limits (basic truncation for now)
    context_text = extracted_text[:4000] 
    
    # Generate structured revision using OpenAI service
    content = openai_service.generate_revision_content(
        topic=f"Extracted Content: {context_text}",
        language=language,
        difficulty=difficulty
    )
    
    if not content:
        return jsonify({"message": "Failed to generate content from AI"}), 500
        
    return jsonify({
        "message": "File processed successfully",
        "extracted_text_preview": extracted_text[:200] + "...",
        "ai_content": content
    }), 200
