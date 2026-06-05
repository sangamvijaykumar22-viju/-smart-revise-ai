import os
import json
from groq import Groq
from dotenv import load_dotenv

# Ensure .env is loaded from the backend directory
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

class OpenAIService:

    # Used ONLY for structured revision content generation (returns JSON)
    REVISION_SYSTEM_PROMPT = """
You are SmartRevise AI, a technical assistant.
You must return ONLY a raw JSON object.
Do NOT include any markdown code fences (```json).
Do NOT include any text before or after the JSON.
Your goal is ACCURACY, CLARITY, and CORRECTNESS.
"""

    # Used ONLY for the chat interface (returns clean markdown, NO JSON)
    CHAT_SYSTEM_PROMPT = """
You are Nexus AI, a premium AI programming tutor built into SmartRevise AI. You behave exactly like ChatGPT — precise, helpful, and clear.

You specialize strictly in:
• C Programming • C++ • Python • Data Structures & Algorithms • Operating Systems • DBMS • SQL • Computer Networks • JavaScript • Software Engineering

RESPONSE FORMAT RULES — Follow these STRICTLY:
1. NEVER return JSON arrays or JSON objects in your response. This is forbidden.
2. Use clean Markdown formatting ONLY:
   - Use **bold** for important terms
   - Use ### headings for sections
   - Use bullet points (- item) for lists
   - Use numbered lists (1. item) for steps
   - Use ```language code blocks for ALL code
3. When showing code: always use triple backtick fences with the language name (e.g. ```python, ```java, ```c)
4. Keep explanations clear, concise, and structured
5. After explaining, show a working code example in a proper code block
6. No emojis. No casual language. Respond like a professional technical tutor.

EXAMPLE of correct format:
### Inheritance in Python
Inheritance allows a child class to inherit properties from a parent class.

**Key terms:**
- **Parent class**: The class being inherited from
- **Child class**: The class that inherits

```python
class Animal:
    def speak(self):
        print("Animal speaks")

class Dog(Animal):
    def bark(self):
        print("Dog barks")
```
"""


    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY", "")
        self.client = Groq(api_key=api_key)
        self.primary_model = "llama-3.3-70b-versatile"
        self.fallback_model = "llama-3.1-8b-instant"

    def _get_completion(self, messages, temperature=0.3, max_tokens=4096):
        """Internal helper to call Groq with automatic model fallback for rate limits."""
        try:
            # Try primary high-quality model first
            return self.client.chat.completions.create(
                model=self.primary_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
        except Exception as e:
            # Check if it's a rate limit error (429)
            error_str = str(e).lower()
            if "429" in error_str or "rate limit" in error_str:
                print(f"[!] Primary model rate limited. Falling back to {self.fallback_model}...")
                try:
                    return self.client.chat.completions.create(
                        model=self.fallback_model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                except Exception as fallback_e:
                    print(f"[!!] Fallback model also failed: {fallback_e}")
                    raise fallback_e
            raise e

    def generate_revision_content(self, topic, language, difficulty, history=None):
        """Generates structured revision notes, MCQs, and a coding question using Groq."""
        print(f">>> generate_revision_content topic='{topic}' lang='{language}' diff='{difficulty}'")
        
        history_context = ""
        if history and len(history) > 0:
            history_context = f"\nCRITICAL: DO NOT repeat any of the following questions or problems which the user has already seen:\n{', '.join(history)}\n"

        prompt = f"""Generate a structured revision guide for the topic: '{topic}' (Language context: {language}, Difficulty: {difficulty}).
{history_context}
You MUST return a valid JSON object. 

Required JSON structure:
{{
  "notes": [
    {{"title": "Section Title", "content": "Detailed markdown explanation"}}
  ],
  "mcqs": [
    {{"question": "Question text", "options": ["A","B","C","D"], "answer": "Exact correct option text", "difficulty": "{difficulty}", "explanation": "Why it is correct"}}
  ],
  "coding_practice": {{
    "real_life_problem": {{"title": "Problem title", "scenario": "Scenario description", "hint": "Implementation hint", "solution": "Code with \\n for newlines", "output": "Expected output"}},
    "practice_questions": [{{"statement": "Challenge statement", "input": "Sample input", "output": "Expected output"}}]
  }},
  "roadmap": ["subtopic1", "subtopic2", "subtopic3", "subtopic4", "subtopic5", "subtopic6"],
  "further_reading": ["concept1", "concept2", "concept3", "concept4", "concept5"]
}}

STRICT RULES:
1. notes: exactly 5 sections.
2. mcqs: exactly 5 questions.
3. practice_questions: exactly 5 coding challenges.
4. roadmap: exactly 6 specific subtopics inside '{topic}'.
5. further_reading: exactly 5 conceptual topics missing from roadmap.
6. ESCAPE all double quotes inside string values using backslashes.
"""

        try:
            api_key = os.getenv("GROQ_API_KEY", "")
            if not api_key or api_key == "your-groq-api-key-here":
                return {"error": "Groq API key not configured."}

            # Use primary model for better JSON compliance
            response = self.client.chat.completions.create(
                model=self.primary_model,
                messages=[
                    {"role": "system", "content": self.REVISION_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )

            raw = response.choices[0].message.content.strip()

            try:
                return json.loads(raw)
            except json.JSONDecodeError as je:
                print(f"[-] Initial JSON parse failed: {je}")
                # Fallback to robust extraction
                start_idx = raw.find('{')
                end_idx = raw.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    raw_cleaned = raw[start_idx:end_idx+1]
                    try:
                        return json.loads(raw_cleaned)
                    except json.JSONDecodeError as je2:
                        print(f"[-] Robust JSON parse also failed: {je2}")
                        print(f"[-] Raw content: {raw}")
                        raise je2
                raise je

        except Exception as e:
            import traceback
            error_msg = f"Error calling Groq API: {e}"
            print(error_msg)
            print(traceback.format_exc())
            return {"error": error_msg}


    def generate_chat_response(self, messages):
        """Generates a conversational AI response for the chatbot."""
        api_key = os.getenv("GROQ_API_KEY", "")

        if not api_key or api_key == "your-groq-api-key-here":
            return "Groq API key is not configured. Please add GROQ_API_KEY to the backend .env file."

        try:
            response = self._get_completion(
                messages=[
                    {"role": "system", "content": self.CHAT_SYSTEM_PROMPT},
                    *messages
                ],
                temperature=0.5,
                max_tokens=2048
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[-] Groq Error: {e}")
            return f"SmartRevise AI Error: Unable to reach Groq API. {str(e)}"

    def generate_chat_stream(self, messages):
        """Generates a streaming response for the chatbot."""
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            yield "Error: API key not set."
            return

        try:
            stream = self.client.chat.completions.create(
                model=self.primary_model,
                messages=[
                    {"role": "system", "content": self.CHAT_SYSTEM_PROMPT},
                    *messages
                ],
                temperature=0.5,
                max_tokens=2048,
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error: {str(e)}"
