import os
import re

html_files = ["results.html", "analytics.html", "saved-revisions.html", "upload.html"]
replacement_expr = "(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com')"
replacement_template = "${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com'}"

for filename in html_files:
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Replace occurrences in template literals: `http://127.0.0.1:5050...`
        new_content = content.replace("`http://127.0.0.1:5050", f"`{replacement_template}")
        
        # 2. Replace occurrences in double quotes: "http://127.0.0.1:5050/..."
        new_content = re.sub(
            r'"http://127.0.0.1:5050(.*?[^\\])"',
            rf'{replacement_expr} + "\1"',
            new_content
        )
        
        # 3. Replace occurrences in single quotes: 'http://127.0.0.1:5050/...'
        new_content = re.sub(
            r"'http://127.0.0.1:5050(.*?[^\\])'",
            rf"{replacement_expr} + '\1'",
            new_content
        )

        if new_content != content:
            with open(filename, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated HTML: {filename}")
