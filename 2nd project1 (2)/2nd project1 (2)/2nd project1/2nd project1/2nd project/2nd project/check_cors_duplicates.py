import urllib.request

url = "http://127.0.0.1:5000/api/auth/login"
req = urllib.request.Request(url, method="OPTIONS")
req.add_header("Origin", "http://127.0.0.1:5500")
req.add_header("Access-Control-Request-Method", "POST")
req.add_header("Access-Control-Request-Headers", "Content-Type")

print(f"Checking OPTIONS request to {url}...")
try:
    with urllib.request.urlopen(req) as response:
        headers = response.info()
        print(f"Status Code: {response.getcode()}")
        
        # Get all instances of the header
        cors_headers = headers.get_all("Access-Control-Allow-Origin")
        print(f"Access-Control-Allow-Origin values: {cors_headers}")
        
        if cors_headers and len(cors_headers) > 1:
            print("\nWARNING: DUPLICATE Access-Control-Allow-Origin headers detected!")
        elif cors_headers:
            print("\nSUCCESS: Single Access-Control-Allow-Origin header is present.")
        else:
            print("\nFAILURE: Access-Control-Allow-Origin header is MISSING!")
            
except Exception as e:
    print(f"Error: {e}")
