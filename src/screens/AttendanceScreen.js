import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, Platform, Text, ScrollView } from 'react-native';
import { Camera } from 'expo-camera';
import { Button, Card, ActivityIndicator, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import Webcam from 'react-webcam';

// Utility: Convert any image URI to JPEG blob using canvas (web only)
async function uriToJpegBlob(uri) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert image to blob'));
        },
        'image/jpeg',
        0.95
      );
    };
    img.onerror = reject;
    img.src = uri;
  });
}

// Utility: Convert base64 to JPEG blob (web only)
async function base64ToJpegBlob(base64Data) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert base64 to blob'));
        },
        'image/jpeg',
        0.95
      );
    };
    img.onerror = reject;
    img.src = base64Data;
  });
}

// Utility: Process image for upload (ensures RGB JPEG format)
async function processImageForUpload(image, index) {
  if (Platform.OS === 'web') {
    if (image.uri && image.uri.startsWith('data:')) {
      const blob = await base64ToJpegBlob(image.uri);
      return new File([blob], `attendance_photo${index+1}.jpg`, { type: 'image/jpeg' });
    } else if (image.uri) {
      const blob = await uriToJpegBlob(image.uri);
      return new File([blob], `attendance_photo${index+1}.jpg`, { type: 'image/jpeg' });
    } else if (image.base64) {
      const base64Data = `data:image/jpeg;base64,${image.base64}`;
      const blob = await base64ToJpegBlob(base64Data);
      return new File([blob], `attendance_photo${index+1}.jpg`, { type: 'image/jpeg' });
    }
  } else {
    const imageUri = image.uri || image.base64;
    if (imageUri.startsWith('data:')) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new File([blob], `attendance_photo${index+1}.jpg`, { type: 'image/jpeg' });
    } else {
      return {
        uri: imageUri,
        type: 'image/jpeg',
        name: `attendance_photo${index+1}.jpg`,
      };
    }
  }
}

const AttendanceScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera?.Constants?.Type?.front || 1);
  const [capturedImages, setCapturedImages] = useState([]); // Array for multiple photos
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // For web: capture photo from webcam and add to array
  const captureWebcamPhoto = async () => {
    if (cameraRef.current && capturedImages.length < 3 && !isCapturing) {
      setIsCapturing(true);
      try {
        const imageSrc = cameraRef.current.getScreenshot();
        setCapturedImages((prev) => [...prev, { uri: imageSrc }]);
        setAttendanceResult(null);
        Alert.alert('Success', 'Photo captured! You can capture up to 3 photos for better accuracy.');
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  // For native: capture photo and add to array
  const takePicture = async () => {
    if (cameraRef.current && capturedImages.length < 3 && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setCapturedImages((prev) => [...prev, photo]);
        setAttendanceResult(null);
        Alert.alert('Success', 'Photo captured! You can capture up to 3 photos for better accuracy.');
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  // Pick image from gallery and add to array
  const pickImage = async () => {
    if (capturedImages.length >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 photos. Please remove one first.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      setCapturedImages((prev) => [...prev, result.assets[0]]);
      setAttendanceResult(null);
      Alert.alert('Success', 'Photo added! You can add up to 3 photos for better accuracy.');
    }
  };

  // Remove a captured image
  const removeCapturedImage = (index) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const markAttendance = async () => {
    if (!employeeName.trim() || !employeeId.trim()) {
      Alert.alert('Error', 'Please fill in both Employee Name and Employee ID');
      return;
    }
    if (capturedImages.length === 0) {
      Alert.alert('Error', 'Please capture at least one photo');
      return;
    }
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('name', employeeName.trim());
      formData.append('employee_id', employeeId.trim());
      // For each captured image, append as photo1, photo2, ...
      for (let i = 0; i < capturedImages.length; i++) {
        const processedFile = await processImageForUpload(capturedImages[i], i);
        formData.append(`photo${i+1}`, processedFile);
      }
      const response = await fetch('http://192.168.29.195:5000/attendance', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setAttendanceResult(result);
        if (result.success) {
          Alert.alert(
            'Attendance Marked Successfully!', 
            `${result.message}\n\nEmployee: ${result.employee.name}\nID: ${result.employee.employee_id}\nConfidence: ${result.employee.confidence * 100}%`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setCapturedImages([]);
                  setAttendanceResult(null);
                }
              }
            ]
          );
        }
      } else {
        Alert.alert('Attendance Failed', result.error || 'Failed to process attendance. Please try again.');
      }
    } catch (error) {
      console.error('Attendance error:', error);
      Alert.alert('Network Error', 'Unable to connect to server. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.errorText}>Camera access is required for attendance</Text>
            <Text style={styles.errorSubtext}>
              Please grant camera permission to capture photos for face recognition
            </Text>
            <Button 
              mode="contained" 
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Mark Attendance</Text>
          <Text style={styles.subtitle}>
            Enter your Employee ID and Name, then capture 1-3 clear, front-facing photos for attendance
          </Text>
          <TextInput
            label="Employee Name"
            value={employeeName}
            onChangeText={setEmployeeName}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Employee ID"
            value={employeeId}
            onChangeText={setEmployeeId}
            style={styles.input}
            mode="outlined"
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Capture Photos ({capturedImages.length}/3)</Text>
          <View style={styles.cameraContainer}>
            {Platform.OS === 'web' && Webcam ? (
              <>
                <Webcam
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width={300}
                  height={225}
                  style={{ borderRadius: 10 }}
                  ref={cameraRef}
                />
                <Button
                  mode="contained"
                  onPress={captureWebcamPhoto}
                  style={styles.captureButton}
                  disabled={capturedImages.length >= 3 || isCapturing}
                  loading={isCapturing}
                >
                  {isCapturing ? 'Capturing...' : 'Capture Photo'}
                </Button>
              </>
            ) : Platform.OS === 'web' ? (
              <Text style={styles.warningText}>
                Camera not available on web. Please use the gallery option below.
              </Text>
            ) : (
              <>
                <Camera
                  style={styles.camera}
                  type={type}
                  ref={cameraRef}
                >
                  <View style={styles.cameraButtonContainer}>
                    <Button
                      mode="contained"
                      onPress={takePicture}
                      style={styles.captureButton}
                      disabled={capturedImages.length >= 3 || isCapturing}
                      loading={isCapturing}
                    >
                      {isCapturing ? 'Capturing...' : 'Take Picture'}
                    </Button>
                  </View>
                </Camera>
              </>
            )}
          </View>
          <Button
            mode="outlined"
            onPress={pickImage}
            style={styles.galleryButton}
            disabled={capturedImages.length >= 3}
          >
            Add from Gallery
          </Button>
          {capturedImages.length > 0 && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Captured Photos:</Text>
              {capturedImages.map((image, index) => (
                <View key={index} style={styles.previewItem}>
                  <Text style={styles.previewText}>Photo {index + 1}</Text>
                  <Button
                    mode="text"
                    onPress={() => removeCapturedImage(index)}
                    style={styles.removeButton}
                  >
                    Remove
                  </Button>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={markAttendance}
            style={styles.registerButton}
            disabled={!employeeName.trim() || !employeeId.trim() || capturedImages.length === 0 || isProcessing}
            loading={isProcessing}
          >
            {isProcessing ? 'Marking...' : 'Mark Attendance'}
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  cameraContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  camera: {
    width: 300,
    height: 225,
    borderRadius: 10,
  },
  cameraButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  captureButton: {
    marginTop: 8,
    minWidth: 120,
  },
  galleryButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  previewContainer: {
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    minWidth: 60,
  },
  registerButton: {
    marginBottom: 12,
    minHeight: 48,
  },
  cancelButton: {
    minHeight: 48,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#f57c00',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    marginTop: 16,
  },
  input: {
    marginBottom: 16,
  },
});

export default AttendanceScreen; 