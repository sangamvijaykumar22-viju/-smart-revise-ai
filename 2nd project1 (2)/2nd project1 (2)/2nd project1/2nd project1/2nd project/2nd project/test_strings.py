import urllib.request
import json
import urllib.parse
import os

base_url = "http://127.0.0.1:5000/api"

def make_request(url, payload=None, token=None):
    req = urllib.request.Request(url)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    
    data_bytes = json.dumps(payload).encode('utf-8') if payload else None
    
    try:
        with urllib.request.urlopen(req, data=data_bytes) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except:
            return e.code, e.read().decode()

# Register/Login
make_request(f"{base_url}/auth/register", {"username": "testuser_debug", "email": "debug@test.com", "password": "password"})
status, data = make_request(f"{base_url}/auth/login", {"email": "debug@test.com", "password": "password"})
if status != 200:
    print("Login failed:", data)
    exit(1)

token = data.get("access_token")

print("Calling generate for 'strings'...")
status, generate_data = make_request(
    f"{base_url}/revision/generate",
    {"topic": "strings", "language": "Python", "difficulty": "Beginner"},
    token
)

print(f"Status: {status}")
print("Response:", json.dumps(generate_data, indent=2))
