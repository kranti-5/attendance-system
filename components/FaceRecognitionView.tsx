import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { reactFaceRecognitionService } from '../services/ReactFaceRecognitionService';

const { width, height } = Dimensions.get('window');

interface FaceRecognitionViewProps {
  onFaceDetected: (result: {
    detected: boolean;
    confidence: number;
    personId?: string;
    personName?: string;
    error?: string;
  }) => void;
  onClose: () => void;
  mode: 'detection' | 'registration' | 'verification';
  employeeId?: string;
  employeeName?: string;
}

export default function FaceRecognitionView({
  onFaceDetected,
  onClose,
  mode,
  employeeId,
  employeeName,
}: FaceRecognitionViewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
        await processImage(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
        setIsProcessing(false);
      }
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      let result;
      
      switch (mode) {
        case 'detection':
          result = await reactFaceRecognitionService.detectFaces(imageUri);
          break;
        case 'registration':
          if (employeeId && employeeName) {
            const faceId = await reactFaceRecognitionService.addPersonToGroup(
              employeeId,
              employeeName,
              imageUri
            );
            result = {
              detected: true,
              confidence: 0.9,
              personId: faceId,
            };
          } else {
            result = await reactFaceRecognitionService.detectFaces(imageUri);
          }
          break;
        case 'verification':
          const searchResult = await reactFaceRecognitionService.searchPerson(imageUri);
          result = {
            detected: searchResult.found,
            confidence: searchResult.confidence,
            personId: searchResult.personId,
            error: searchResult.error,
          };
          break;
        default:
          result = await reactFaceRecognitionService.detectFaces(imageUri);
      }

      setDetectionResult(result);
      onFaceDetected(result);
    } catch (error: any) {
      const errorResult = {
        detected: false,
        confidence: 0,
        error: error.message || 'Face processing failed',
      };
      setDetectionResult(errorResult);
      onFaceDetected(errorResult);
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setDetectionResult(null);
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'detection':
        return 'Face Detection';
      case 'registration':
        return 'Register Employee';
      case 'verification':
        return 'Face Verification';
      default:
        return 'Face Recognition';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'detection':
        return 'Position your face in the frame and take a photo';
      case 'registration':
        return `Registering ${employeeName || 'employee'} face`;
      case 'verification':
        return 'Verify your identity by taking a photo';
      default:
        return 'Position your face in the frame';
    }
  };

  const getResultMessage = () => {
    if (!detectionResult) return '';

    if (detectionResult.error) {
      return detectionResult.error;
    }

    if (detectionResult.detected) {
      const confidence = Math.round(detectionResult.confidence * 100);
      switch (mode) {
        case 'detection':
          return `Face detected with ${confidence}% confidence`;
        case 'registration':
          return `Employee registered successfully (${confidence}% confidence)`;
        case 'verification':
          return detectionResult.found
            ? `Identity verified (${confidence}% confidence)`
            : 'Identity not recognized';
        default:
          return `Face detected (${confidence}% confidence)`;
      }
    } else {
      return 'No face detected';
    }
  };

  const getResultIcon = () => {
    if (!detectionResult) return 'camera';

    if (detectionResult.error) return 'alert-circle';
    if (detectionResult.detected) {
      if (mode === 'verification' && !detectionResult.found) {
        return 'close-circle';
      }
      return 'checkmark-circle';
    }
    return 'close-circle';
  };

  const getResultColor = () => {
    if (!detectionResult) return '#007AFF';

    if (detectionResult.error) return '#F44336';
    if (detectionResult.detected) {
      if (mode === 'verification' && !detectionResult.found) {
        return '#F44336';
      }
      return '#4CAF50';
    }
    return '#F44336';
  };

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{getModeTitle()}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
          
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}

          {detectionResult && !isProcessing && (
            <View style={styles.resultOverlay}>
              <Ionicons 
                name={getResultIcon() as any} 
                size={48} 
                color={getResultColor()} 
              />
              <Text style={[styles.resultText, { color: getResultColor() }]}>
                {getResultMessage()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.button} onPress={retakePicture}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{getModeTitle()}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructions}>{getModeDescription()}</Text>
          </View>

          {/* Camera Frame */}
          <View style={styles.frameContainer}>
            <View style={styles.frame} />
            <Text style={styles.frameText}>Position your face in the frame</Text>
          </View>

          {/* Bottom Controls */}
          <View style={styles.controls}>
            <View style={styles.placeholder} />
            
            <TouchableOpacity 
              style={[styles.captureButton, isProcessing && styles.disabledButton]} 
              onPress={takePicture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="#007AFF" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  instructions: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  frameText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  placeholder: {
    width: 80,
    height: 80,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  capturedImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 