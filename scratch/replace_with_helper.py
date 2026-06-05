import os
import re

html_files = ["results.html", "analytics.html", "saved-revisions.html", "upload.html"]

for filename in html_files:
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            content = f.read()

        # Replace double quoted URLs
        new_content = re.sub(
            r'"http://127.0.0.1:5050(/[^"]*)"',
            r'getApiUrl("\1")',
            content
        )

        # Replace single quoted URLs
        new_content = re.sub(
            r"'http://127.0.0.1:5050(/[^']*)'",
            r"getApiUrl('\1')",
            new_content
        )

        # Replace backtick quoted URLs
        new_content = re.sub(
            r'`http://127.0.0.1:5050/([^`]*)`',
            r'getApiUrl(`/\1`)',
            new_content
        )

        if new_content != content:
            with open(filename, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated HTML with getApiUrl: {filename}")
