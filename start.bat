@echo off
echo ========================================
echo Face Recognition Attendance System
echo ========================================
echo.

echo Starting Backend Server...
echo.
cd backend
start "Backend Server" cmd /k "python app.py"
echo Backend server started on http://localhost:5000
echo.

echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend (Expo)...
echo.
cd ..
start "Frontend (Expo)" cmd /k "npm start"
echo Frontend started - check the terminal for the URL
echo.

echo ========================================
echo System Status:
echo - Backend: http://localhost:5000
echo - Frontend: Check the Expo terminal for URL
echo ========================================
echo.
echo Press any key to open the backend health check...
pause > nul
start http://localhost:5000/health

echo.
echo System is ready! You can now:
echo 1. Register employees at the frontend
echo 2. Mark attendance using face recognition
echo 3. View system statistics on the home screen
echo.
pause 