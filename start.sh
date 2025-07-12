#!/bin/bash

echo "========================================"
echo "Face Recognition Attendance System"
echo "========================================"
echo

echo "Starting Backend Server..."
echo
cd backend
python app.py &
BACKEND_PID=$!
echo "Backend server started on http://localhost:5000 (PID: $BACKEND_PID)"
echo

echo "Waiting 3 seconds for backend to initialize..."
sleep 3

echo
echo "Starting Frontend (Expo)..."
echo
cd ..
npm start &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"
echo

echo "========================================"
echo "System Status:"
echo "- Backend: http://localhost:5000"
echo "- Frontend: Check the Expo terminal for URL"
echo "========================================"
echo

# Function to cleanup processes on exit
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "System is ready! You can now:"
echo "1. Register employees at the frontend"
echo "2. Mark attendance using face recognition"
echo "3. View system statistics on the home screen"
echo
echo "Press Ctrl+C to stop all servers"
echo

# Keep script running
wait 