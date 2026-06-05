import os
import sys
from flask import Flask
from flask_mail import Mail, Message
from dotenv import load_dotenv

# Add parent directory to path so we can import from backend
sys.path.append(os.path.join(os.getcwd(), 'backend'))

load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

app = Flask(__name__)

# Basic Config
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', app.config['MAIL_USERNAME'])

mail = Mail(app)

print("--- MAIL CONFIGURATION ---")
print(f"Server: {app.config['MAIL_SERVER']}")
print(f"Port: {app.config['MAIL_PORT']}")
print(f"TLS: {app.config['MAIL_USE_TLS']}")
print(f"Username: {app.config['MAIL_USERNAME']}")
print(f"Default Sender: {app.config['MAIL_DEFAULT_SENDER']}")
print("--------------------------")

if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD'] or app.config['MAIL_USERNAME'] == 'your-email@gmail.com':
    print("\n[!] ERROR: You haven't updated your .env file with real credentials yet.")
    print("Please edit backend/.env and provide your actual Gmail and App Password.")
    sys.exit(1)

with app.app_context():
    try:
        print("\n[ ] Attempting to send test email to: " + app.config['MAIL_USERNAME'])
        msg = Message("SmartRevise Test Email",
                      recipients=[app.config['MAIL_USERNAME']],
                      body="If you can see this, your SmartRevise email configuration is working correctly!")
        mail.send(msg)
        print("[+] SUCCESS! Test email sent successfully.")
    except Exception as e:
        print("\n[-] FAILED to send email.")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        print("\nPossible fixes:")
        print("1. Verify your App Password is correct (not your regular password).")
        print("2. Ensure 2-Step Verification is enabled in Google.")
        print("3. Check if your internet connection allows SMTP traffic on port 587.")
