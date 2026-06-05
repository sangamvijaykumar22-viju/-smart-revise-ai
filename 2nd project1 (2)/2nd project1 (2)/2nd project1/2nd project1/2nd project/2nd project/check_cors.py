import urllib.request

url = "http://127.0.0.1:5000/api/auth/login"
req = urllib.request.Request(url, method="OPTIONS")
req.add_header("Origin", "http://127.0.0.1:5500")
req.add_header("Access-Control-Request-Method", "POST")
req.add_header("Access-Control-Request-Headers", "Content-Type")

print(f"Checking OPTIONS request to {url}...")
try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        print("Response Headers:")
        headers = response.info()
        for key in headers.keys():
            print(f"  {key}: {headers[key]}")
        
        if "Access-Control-Allow-Origin" in headers:
            print(f"\nSUCCESS: Access-Control-Allow-Origin header is present: {headers['Access-Control-Allow-Origin']}")
        else:
            print("\nFAILURE: Access-Control-Allow-Origin header is MISSING!")
except Exception as e:
    print(f"Error connecting to server: {e}")
