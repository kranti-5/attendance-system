import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';

export default function AttendanceScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [faceBox, setFaceBox] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const cameraRef = useRef(null);
  const userId = 1; // Replace with actual logic

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleFacesDetected = ({ faces }) => {
    if (faces.length > 0) {
      setFaceBox(faces[0].bounds);
      setFaceDetected(true);
    } else {
      setFaceBox(null);
      setFaceDetected(false);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && faceDetected) {
      setScanning(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true });

      try {
        const response = await fetch('http://localhost/Demo/mobile-app/backend/attendance.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            attendancePhoto: photo.base64,
          }),
        });
        const data = await response.json();
        if (data.success) {
          Alert.alert('Success', 'Face matched! Attendance marked.');
          navigation.replace('Dashboard');
        } else {
          Alert.alert('Failed', data.error || 'Face did not match. Try again.');
        }
      } catch (error) {
        Alert.alert('Error', 'Could not connect to server.');
      } finally {
        setScanning(false);
      }
    } else {
      Alert.alert('No Face Detected', 'Please ensure your face is visible in the frame.');
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
          Camera & Face Detection is not supported in Web version. Please use mobile app.
        </Text>
      </View>
    );
  }

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance (Face Recognition)</Text>
      <View style={styles.cameraFrame}>
        <Camera
          style={styles.camera}
          type={Camera.Constants.Type.front}
          ref={cameraRef}
          onFacesDetected={handleFacesDetected}
          faceDetectorSettings={{
            mode: FaceDetector.FaceDetectorMode.fast,
            detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
            runClassifications: FaceDetector.FaceDetectorClassifications.none,
          }}
        >
          {faceBox && (
            <View
              style={{
                position: 'absolute',
                left: faceBox.origin.x,
                top: faceBox.origin.y,
                width: faceBox.size.width,
                height: faceBox.size.height,
                borderWidth: 2,
                borderColor: '#fff',
                borderRadius: 8,
              }}
            />
          )}
        </Camera>
      </View>
      {!faceDetected && <Text style={styles.noFace}>No face detected</Text>}
      <TouchableOpacity
        style={[styles.button, !faceDetected && styles.buttonDisabled]}
        onPress={takePicture}
        disabled={!faceDetected || scanning}
      >
        <Text style={styles.buttonText}>
          {scanning ? 'Checking...' : 'Capture & Match'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  cameraFrame: {
    width: 320,
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 16,
  },
  camera: {
    flex: 1,
  },
  button: {
    width: 200,
    height: 46,
    backgroundColor: '#1976d2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: '#b0b8c1',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  noFace: {
    color: '#e57373',
    marginBottom: 8,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
