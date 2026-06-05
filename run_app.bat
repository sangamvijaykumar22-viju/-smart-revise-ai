@echo off
echo ====================================================
echo Starting SmartRevise AI - All Services
echo ====================================================

cd /d "%~dp0"

:: Check if virtual environment exists
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment 'venv' not found.
    echo Creating virtual environment...
    "C:\Users\Dell\AppData\Local\Programs\Python\Python312\python.exe" -m venv venv
    if errorlevel 1 (
        echo Failed to create virtual environment.
        pause
        exit /b
    )
)

:: Run database setup
echo [1/4] Initializing Database (Demo and Admin Users)...
venv\Scripts\python.exe create_demo_user.py
venv\Scripts\python.exe create_admin.py

:: Start Flask Backend in a new command window
echo [2/4] Starting Flask Backend on http://127.0.0.1:5050 ...
start "SmartRevise Backend" cmd /c "venv\Scripts\python.exe run.py"

:: Start Frontend Python HTTP Server in a new command window
echo [3/4] Starting Frontend Server on http://127.0.0.1:8000 ...
start "SmartRevise Frontend" cmd /c "venv\Scripts\python.exe -m http.server 8000"

:: Wait 3 seconds for servers to initialize
timeout /t 3 >nul

:: Open browser to the portal page
echo [4/4] Launching application in browser...
start http://127.0.0.1:8000/login.html

echo ====================================================
echo SmartRevise AI is running!
echo  - Backend API: http://127.0.0.1:5050
echo  - Frontend Web UI: http://127.0.0.1:8000/login.html
echo ====================================================
echo Press any key to exit this installer window (the servers will keep running).
pause >nul
