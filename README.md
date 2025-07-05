# Attendance System

A React Native mobile application for managing worker attendance using facial recognition technology.

## Features

### 🎯 Core Features
- **Facial Recognition Attendance**: Take photos for check-in/check-out using device camera
- **Real-time Processing**: Instant face recognition with confidence scoring
- **Attendance Tracking**: Automatic check-in/check-out detection based on daily status
- **Photo Storage**: Store attendance photos with timestamps
- **Status Management**: Track attendance verification status (pending, verified, rejected)

### 📱 User Interface
- **Modern Design**: Clean, intuitive interface with smooth animations
- **Three Main Tabs**:
  - **Attendance**: Main screen for marking attendance with camera
  - **History**: View all attendance records with search and filtering
  - **Profile**: Worker information and app settings

### 🔍 Advanced Features
- **Search & Filter**: Find specific attendance records by worker name or status
- **Statistics Dashboard**: View attendance statistics and trends
- **Settings Management**: Configure notifications, location services, and privacy
- **Data Export**: Export attendance records (placeholder for future implementation)

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router with tab navigation
- **Camera**: Expo Camera for photo capture
- **UI Components**: Custom components with React Native styling
- **State Management**: React hooks for local state
- **Storage**: In-memory storage (can be extended to AsyncStorage or database)

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendance-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Project Structure

```
attendance-system/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Main attendance screen
│   │   ├── explore.tsx        # History screen
│   │   ├── profile.tsx        # Profile screen
│   │   └── _layout.tsx        # Tab navigation layout
│   └── _layout.tsx            # Root layout
├── components/
│   └── CameraView.tsx         # Camera component for photo capture
├── services/
│   └── AttendanceService.ts   # Attendance logic and data management
├── constants/
├── hooks/
└── assets/
```

## Usage Guide

### For Workers

1. **Marking Attendance**
   - Open the app and go to the "Attendance" tab
   - Tap "Mark Attendance" button
   - Position your face in the camera frame
   - Tap the capture button to take a photo
   - Wait for face recognition processing
   - Confirm check-in/check-out status

2. **Viewing History**
   - Navigate to the "History" tab
   - View all your attendance records
   - Use search to find specific records
   - Filter by type (check-in/check-out) or status

3. **Profile Management**
   - Go to the "Profile" tab
   - View your attendance statistics
   - Configure app settings
   - Manage personal information

### For Administrators

- **Verification**: Review pending attendance records
- **Statistics**: View overall attendance metrics
- **Data Management**: Export and manage attendance data

## Configuration

### Camera Permissions
The app requires camera permissions for attendance marking. These are automatically requested when the camera is first accessed.

### Face Recognition
Currently uses simulated face recognition for demonstration purposes. In production, integrate with:
- AWS Rekognition
- Google Cloud Vision API
- Azure Face API
- Custom ML models

### Storage
The current implementation uses in-memory storage. For production, consider:
- AsyncStorage for local persistence
- SQLite for local database
- Cloud storage for remote backup
- API integration for real-time sync

## Development

### Adding New Features

1. **New Screens**: Add files to `app/(tabs)/` directory
2. **Components**: Create reusable components in `components/` directory
3. **Services**: Add business logic in `services/` directory
4. **Navigation**: Update `_layout.tsx` for new tabs

### Styling
- Uses React Native StyleSheet for styling
- Follows a consistent color scheme
- Responsive design for different screen sizes

### Testing
- Test on both iOS and Android devices
- Verify camera functionality
- Test face recognition flow
- Validate attendance logic

## Future Enhancements

### Planned Features
- [ ] Real face recognition API integration
- [ ] Location-based attendance verification
- [ ] Push notifications for attendance reminders
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Biometric authentication
- [ ] QR code attendance option
- [ ] Admin dashboard
- [ ] Report generation

### Technical Improvements
- [ ] Database integration (SQLite/Realm)
- [ ] Cloud synchronization
- [ ] Performance optimization
- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] App store deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Note**: This is a demonstration application. For production use, implement proper security measures, real face recognition APIs, and robust data storage solutions.
