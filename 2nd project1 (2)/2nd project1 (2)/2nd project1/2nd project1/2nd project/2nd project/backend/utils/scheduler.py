import threading
import time
from datetime import datetime
from ..extensions import db
from ..models import Planner, User
from .mail_service import send_reminder_email

def check_for_reminders(app):
    """Periodic task to check for tasks that need reminders."""
    with app.app_context():
        # Current time in UTC (or match your DB timezone)
        now = datetime.now()
        current_time_str = now.strftime('%H:%M')
        current_date_str = now.strftime('%Y-%m-%d')
        
        print(f"[SCHEDULER] Checking reminders for {current_date_str} {current_time_str}")
        
        # Find tasks scheduled for NOW that haven't been completed
        tasks = Planner.query.filter_by(date=current_date_str, time=current_time_str, completed=False).all()
        
        for task in tasks:
            user = User.query.get(task.user_id)
            if user and user.email:
                print(f"[SCHEDULER] Sending reminder for task '{task.title}' to {user.email}")
                send_reminder_email(user.email, task.title, task.time)

def run_scheduler_loop(app):
    print("[SCHEDULER] Threaded scheduler started.")
    while True:
        # Sleep until the start of the next minute to align checks
        now = datetime.now()
        seconds_to_sleep = 60 - now.second
        time.sleep(seconds_to_sleep)
        try:
            check_for_reminders(app)
        except Exception as e:
            print(f"[SCHEDULER ERROR] {e}")

def start_scheduler(app):
    # Start scheduler as a daemon thread so it doesn't block app shutdown
    t = threading.Thread(target=run_scheduler_loop, args=[app], daemon=True)
    t.start()
    return t

