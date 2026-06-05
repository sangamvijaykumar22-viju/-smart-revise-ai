import os

js_dir = "js"
wrong_prefix = '"(window.location.hostname === \'localhost\' || window.location.hostname === \'127.0.0.1\' ? \'http://127.0.0.1:5050\' : \'https://smart-revise-ai-m3u6.onrender.com\')'
correct_prefix = "(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com')"

for filename in os.listdir(js_dir):
    if filename.endswith(".js"):
        filepath = os.path.join(js_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Remove the extra quotes around the conditional expression
        new_content = content.replace(wrong_prefix, correct_prefix)
        # Also handle potential single quote version
        new_content = new_content.replace(wrong_prefix.replace('"', "'"), correct_prefix)

        if new_content != content:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Corrected: {filename}")
