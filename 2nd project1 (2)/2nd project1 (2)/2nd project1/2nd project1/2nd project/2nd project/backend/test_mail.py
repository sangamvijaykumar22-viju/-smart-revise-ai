
import os
import sys
from flask import Flask
from flask_mail import Mail, Message
from dotenv import load_dotenv

# Add parent directory to path to reach backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

load_dotenv()

app = Flask(__name__)
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', app.config['MAIL_USERNAME'])

mail = Mail(app)

def test_send():
    with app.app_context():
        msg = Message("Test Subject", recipients=[app.config['MAIL_USERNAME']])
        msg.body = "This is a test email from the script."
        try:
            print(f"Attempting to send mail as {app.config['MAIL_USERNAME']} to {app.config['MAIL_USERNAME']}...")
            mail.send(msg)
            print("SUCCESS: Mail sent!")
        except Exception as e:
            print(f"FAILURE: {e}")

if __name__ == "__main__":
    if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
        print("ERROR: MAIL_USERNAME or MAIL_PASSWORD not set in .env")
    else:
        test_send()
