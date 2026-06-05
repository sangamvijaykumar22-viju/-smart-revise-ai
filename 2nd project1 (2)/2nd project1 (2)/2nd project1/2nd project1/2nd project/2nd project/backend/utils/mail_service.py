from flask_mail import Message
from ..extensions import mail
from flask import current_app
import threading
from datetime import datetime
import os

def send_async_email(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
            # Log to stdout
            print(f"[MAIL SUCCESS] {datetime.now()} Sent email to {msg.recipients}")
            
            # Also log to a dedicated file for easier debugging
            log_path = os.path.join(app.root_path, 'mail_log.txt')
            with open(log_path, 'a') as f:
                f.write(f"[{datetime.now()}] SUCCESS: To {msg.recipients} - Subject: {msg.subject}\n")
                
        except Exception as e:
            error_msg = f"[MAIL ERROR] {datetime.now()} Failed to send to {msg.recipients}: {str(e)}"
            print(error_msg)
            
            # Log error to file
            log_path = os.path.join(app.root_path, 'mail_log.txt')
            with open(log_path, 'a') as f:
                f.write(f"[{datetime.now()}] FAILURE: To {msg.recipients} - Error: {str(e)}\n")

def send_email(subject, recipients, body, html=None):
    """Sends an email asynchronously."""
    app = current_app._get_current_object()
    
    # Explicitly pull the sender from config to avoid 'None' issues
    sender = app.config.get('MAIL_DEFAULT_SENDER') or app.config.get('MAIL_USERNAME')
    
    msg = Message(subject, recipients=recipients, sender=sender)
    msg.body = body
    if html:
        msg.html = html
        
    # Start thread
    thr = threading.Thread(target=send_async_email, args=[app, msg])
    thr.start()
    return thr

def send_welcome_email(user_email, username):
    subject = "Welcome to SmartRevise AI!"
    body = f"Hello {username},\n\nThank you for joining SmartRevise AI. We're excited to help you master your coding skills!"
    html = f"<h3>Welcome, {username}!</h3><p>Thank you for joining <b>SmartRevise AI</b>. We're excited to help you master your coding skills!</p>"
    return send_email(subject, [user_email], body, html)

def send_password_reset_email(user_email, reset_token):
    subject = "SmartRevise AI - Password Reset Request"
    body = f"You requested a password reset. Your token is: {reset_token}\n\nIf you did not make this request, please ignore this email."
    html = f"<h3>Password Reset</h3><p>You requested a password reset. Your token is: <b>{reset_token}</b></p><p>If you did not make this request, please ignore this email.</p>"
    return send_email(subject, [user_email], body, html)

def send_reminder_email(user_email, task_title, task_time):
    subject = f"SmartRevise Reminder: {task_title}"
    body = f"Friendly reminder! You have a scheduled task: '{task_title}' at {task_time}."
    html = f"<h3>Task Reminder</h3><p>Friendly reminder! You have a scheduled task:</p><h4>{task_title}</h4><p>Scheduled at: <b>{task_time}</b></p>"
    return send_email(subject, [user_email], body, html)

def send_login_alert_email(user_email, username):
    subject = "SmartRevise AI - New Login Detected"
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    body = f"Hello {username},\n\nA new login was detected on your account at {now}."
    html = f"<h3>New Login Detected</h3><p>Hello <b>{username}</b>,</p><p>A new login was detected on your account at <b>{now}</b>.</p><p>If this wasn't you, please change your password immediately.</p>"
    return send_email(subject, [user_email], body, html)

