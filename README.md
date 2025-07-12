# Face Recognition Attendance System

A modern, secure attendance tracking system using facial recognition technology built with React Native (Expo) and Flask.

## 🚀 Features

- **Multi-Photo Registration**: Capture up to 3 photos per employee for better recognition accuracy
- **Real-time Face Recognition**: Fast and accurate employee identification
- **Web & Mobile Compatible**: Works on web browsers and mobile devices
- **Automatic Attendance Records**: Daily attendance tracking with timestamps
- **Confidence Scoring**: Shows recognition confidence for each attendance mark
- **System Statistics**: Real-time employee count and attendance tracking
- **Secure Storage**: Face encodings stored securely on the server

## 🛠️ Technology Stack

### Frontend
- **React Native** with Expo
- **React Native Paper** for UI components
- **Expo Camera** for photo capture
- **React Webcam** for web camera support

### Backend
- **Flask** web framework
- **face_recognition** library for facial recognition
- **OpenCV** for image processing
- **NumPy** for mathematical operations

## 📋 Prerequisites

### System Requirements
- Python 3.7+
- Node.js 14+
- npm or yarn
- Webcam or camera-enabled device

### Python Dependencies
- Visual Studio C++ Build Tools (Windows)
- CMake
- dlib (may require pre-built wheels)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd checkpy
```

### 2. Install Dependencies

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

**Note**: If you encounter issues installing `dlib` on Windows:
1. Install Visual Studio C++ Build Tools
2. Or use pre-built wheels: `pip install dlib-19.22.0-cp39-cp39-win_amd64.whl`

#### Frontend Setup
```bash
cd ..
npm install
```

### 3. Start the System

#### Windows
```bash
start.bat
```

#### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

#### Manual Start
```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
npm start
```

### 4. Access the Application
- **Backend API**: http://localhost:5000
- **Frontend**: Check the Expo terminal for the URL (usually http://localhost:19006)

## 📱 Usage Guide

### Registering Employees
1. Navigate to "Register New Employee"
2. Enter employee name and ID
3. Capture 1-3 clear, front-facing photos
4. Submit registration

**Tips for Better Recognition:**
- Use good lighting
- Capture front-facing photos
- Avoid shadows on the face
- Take multiple photos from different angles

### Marking Attendance
1. Navigate to "Mark Attendance"
2. Take a clear photo of the employee
3. System automatically identifies and records attendance
4. View confidence score and employee details

## 🔧 API Endpoints

### Registration
- `POST /register` - Register new employee with photos

### Attendance
- `POST /attendance` - Mark attendance with photo
- `GET /attendance/<date>` - Get attendance records for a date

### System
- `GET /employees` - List all registered employees
- `GET /health` - Health check endpoint

## 📊 System Features

### Enhanced Registration
- Multiple photo capture (up to 3)
- Face encoding averaging for better accuracy
- Automatic photo validation
- Clear error messages and guidance

### Improved Attendance
- Real-time face detection
- Confidence scoring
- Detailed attendance records
- Automatic cleanup of temporary files

### Better User Experience
- Loading states and progress indicators
- Comprehensive error handling
- Intuitive UI with clear instructions
- Responsive design for web and mobile

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues
1. **dlib Installation Error**
   - Install Visual Studio C++ Build Tools
   - Use pre-built wheels for Windows

2. **Face Detection Fails**
   - Ensure photos are clear and well-lit
   - Check that faces are front-facing
   - Try capturing multiple photos

3. **Port Already in Use**
   - Change port in `backend/app.py`
   - Kill existing processes on port 5000

#### Frontend Issues
1. **Camera Not Working on Web**
   - Use gallery upload option
   - Check browser permissions
   - Try different browsers

2. **Network Errors**
   - Verify backend is running on correct IP
   - Check firewall settings
   - Update IP address in frontend code

### Debug Information
- Backend logs show face detection details
- Frontend console shows network requests
- Check browser developer tools for errors

## 🔒 Security Considerations

- Face encodings are stored locally
- No raw images are transmitted
- Temporary files are automatically cleaned up
- HTTPS recommended for production

## 📈 Performance Tips

- Use good lighting for photos
- Capture multiple photos during registration
- Ensure stable network connection
- Regular system maintenance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review backend logs for errors
3. Ensure all dependencies are installed
4. Verify network connectivity

---

**Note**: This system is designed for educational and small-scale use. For production environments, consider additional security measures and scalability improvements. 