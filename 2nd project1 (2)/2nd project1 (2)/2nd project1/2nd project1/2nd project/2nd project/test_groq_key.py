from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("No API key found in backend/.env")
    exit(1)

print(f"Using API key: {api_key[:10]}...")

try:
    client = Groq(api_key=api_key)
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Say hello world in one word",
            }
        ],
        model="llama-3.3-70b-versatile",
    )
    print("Response:", chat_completion.choices[0].message.content)
except Exception as e:
    print("Error:", e)
