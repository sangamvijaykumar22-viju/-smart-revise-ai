import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv(r"c:\Users\pares\OneDrive\Desktop\2nd project1\2nd project\2nd project\backend\.env")
api_key = os.getenv("GROQ_API_KEY")

print(f"API Key found: {api_key[:10]}...")

client = Groq(api_key=api_key)

try:
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Hello"}],
    )
    print("Response:", completion.choices[0].message.content)
except Exception as e:
    print("Error:", e)
