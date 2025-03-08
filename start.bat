@echo off
echo Setting up project...

:: Check for Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in PATH
    exit /b 1
)

:: Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    exit /b 1
)

:: Setup Backend
echo Setting up backend...
cd backend

:: Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

:: Install backend dependencies
echo Installing backend dependencies...
pip install -r requirements.txt

:: Start backend server in background
echo Starting backend server...
start "" python -m uvicorn main:app --reload

:: Return to project root
cd ..

:: Setup Frontend
echo Setting up frontend...
cd frontend

:: Install frontend dependencies
echo Installing frontend dependencies...
call npm install

:: Start frontend server
echo Starting frontend server...
start "" npm start

echo.
echo Project started successfully!
echo Backend server is running at http://localhost:8000
echo Frontend server is running at http://localhost:3000
echo.
echo Press Ctrl+C in the terminal windows to stop the servers

:: Keep the console window open
pause
