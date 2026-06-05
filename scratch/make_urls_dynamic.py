import os
import re

js_dir = "js"
render_backend_url = "https://smart-revise-ai-m3u6.onrender.com"

# The dynamic replacement pattern
replacement = f"(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : '{render_backend_url}')"

for filename in os.listdir(js_dir):
    if filename.endswith(".js"):
        filepath = os.path.join(js_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Replace hardcoded base URL in string templates or literals
        # Match 'http://127.0.0.1:5050' or "http://127.0.0.1:5050" or `http://127.0.0.1:5050`
        new_content = re.sub(
            r'[\'"`]http://127.0.0.1:5050[\'"`]',
            replacement,
            content
        )
        
        # Replace occurrences in larger string literals like "http://127.0.0.1:5050/api/..."
        # We replace the base part and concatenate it
        new_content = re.sub(
            r'([\'"`])http://127.0.0.1:5050(.*?)([\'"`])',
            r'\1' + replacement + r' + \1\2\3',
            new_content
        )
        
        # Clean up double concatenations like ' + ' or similar if any
        # Also clean up any extra quotes or concatenations
        # e.g., 'https://url' + '/api'
        
        if new_content != content:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated: {filename}")

print("API URLs successfully modernized to be dynamic!")
