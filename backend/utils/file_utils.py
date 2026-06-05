import PyPDF2
import docx
import io

def extract_text_from_pdf(file_stream):
    """Extracts text from a PDF file stream using PyPDF2."""
    try:
        reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return None

def extract_text_from_docx(file_stream):
    """Extracts text from a DOCX file stream using python-docx."""
    try:
        doc = docx.Document(file_stream)
        text = []
        for para in doc.paragraphs:
            text.append(para.text)
        return "\n".join(text).strip()
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        return None

def extract_text_from_txt(file_stream):
    """Extracts text from a TXT file stream."""
    try:
        # Try to read as UTF-8
        return file_stream.read().decode('utf-8').strip()
    except UnicodeDecodeError:
        # Fallback to latin-1
        file_stream.seek(0)
        return file_stream.read().decode('latin-1').strip()
    except Exception as e:
        print(f"Error extracting TXT text: {e}")
        return None

def extract_text(file, filename):
    """General extractor that routes to specific extractors based on extension."""
    ext = filename.lower().split('.')[-1]
    file_stream = io.BytesIO(file.read())
    
    if ext == 'pdf':
        return extract_text_from_pdf(file_stream)
    elif ext == 'docx':
        return extract_text_from_docx(file_stream)
    elif ext in ['txt', 'md']:
        return extract_text_from_txt(file_stream)
    else:
        return None
