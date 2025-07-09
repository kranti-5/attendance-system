import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import {
    Camera,
    useCameraDevices,
    useCameraPermission,
    useFrameProcessor
} from 'react-native-vision-camera';
import { realtimeFaceRecognitionService } from '../services/RealtimeFaceRecognitionService';

const { width, height } = Dimensions.get('window');

interface RealtimeFaceRecognitionViewProps {
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
  autoCapture?: boolean;
  confidenceThreshold?: number;
}

export default function RealtimeFaceRecognitionView({
  onFaceDetected,
  onClose,
  mode,
  employeeId,
  employeeName,
  autoCapture = false,
  confidenceThreshold = 0.7,
}: RealtimeFaceRecognitionViewProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices && (devices.find((d) => d.position === 'front') || devices[0]);
  const camera = useRef<Camera>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDetection, setLastDetection] = useState<any>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const [isFaceInFrame, setIsFaceInFrame] = useState(false);
  const [facePosition, setFacePosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const faceBoxAnim = useRef(new Animated.Value(0)).current;

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Start pulse animation when face is detected
  useEffect(() => {
    if (isFaceInFrame) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isFaceInFrame, pulseAnim]);

  // Animate face box when position changes
  useEffect(() => {
    if (facePosition) {
      Animated.timing(faceBoxAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      faceBoxAnim.setValue(0);
    }
  }, [facePosition, faceBoxAnim]);

  // Frame processor for real-time face detection
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    // Process frame for face detection
    // This is a simplified implementation - in a real app, you'd use a face detection model
    const faces = detectFacesInFrame(frame);
    
    if (faces.length > 0) {
      const face = faces[0]; // Get the first detected face
      runOnJS(updateFaceDetection)({
        detected: true,
        x: face.x,
        y: face.y,
        width: face.width,
        height: face.height,
        confidence: face.confidence,
      });
    } else {
      runOnJS(updateFaceDetection)(null);
    }
  }, []);

  // Simplified face detection (in real implementation, use a proper face detection model)
  const detectFacesInFrame = (frame: any) => {
    // This is a placeholder - in a real implementation, you would:
    // 1. Use a face detection model (like ML Kit, TensorFlow Lite, or a custom model)
    // 2. Process the frame data to detect faces
    // 3. Return face coordinates and confidence scores
    
    // For now, we'll simulate face detection based on frame properties
    const hasFace = Math.random() > 0.3; // 70% chance of detecting a face
    
    if (hasFace) {
      return [{
        x: width * 0.15,
        y: height * 0.3,
        width: width * 0.7,
        height: width * 0.7,
        confidence: 0.8 + Math.random() * 0.2,
      }];
    }
    
    return [];
  };

  const processCapturedImage = useCallback(async (imagePath: string) => {
    try {
      let result;
      
      switch (mode) {
        case 'detection':
          result = await realtimeFaceRecognitionService.detectFaces(imagePath);
          break;
        case 'registration':
          if (employeeId && employeeName) {
            const faceId = await realtimeFaceRecognitionService.addPersonToGroup(
              employeeId,
              employeeName,
              imagePath
            );
            result = {
              detected: true,
              confidence: 0.9,
              personId: faceId,
              personName: employeeName,
            };
          } else {
            result = await realtimeFaceRecognitionService.detectFaces(imagePath);
          }
          break;
        case 'verification':
          const searchResult = await realtimeFaceRecognitionService.searchPerson(imagePath);
          result = {
            detected: searchResult.found,
            confidence: searchResult.confidence,
            personId: searchResult.personId,
            personName: searchResult.personName,
            error: searchResult.error,
          };
          break;
        default:
          result = await realtimeFaceRecognitionService.detectFaces(imagePath);
      }

      setLastDetection(result);
      setDetectionCount(prev => prev + 1);
      onFaceDetected(result);
    } catch (error: any) {
      const errorResult = {
        detected: false,
        confidence: 0,
        error: error.message || 'Face processing failed',
      };
      setLastDetection(errorResult);
      onFaceDetected(errorResult);
    }
  }, [mode, employeeId, employeeName, onFaceDetected]);

  const handleAutoCapture = useCallback(async () => {
    if (isProcessing || !camera.current) return;
    
    setIsProcessing(true);
    try {
      const photo = await camera.current.takePhoto();
      
      await processCapturedImage(photo.path);
    } catch (error) {
      console.error('Auto-capture failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processCapturedImage]);

  const updateFaceDetection = useCallback((faceData: any) => {
    if (faceData) {
      setIsFaceInFrame(true);
      setFacePosition({
        x: faceData.x,
        y: faceData.y,
        width: faceData.width,
        height: faceData.height,
      });
      
      // Auto-capture logic
      if (autoCapture && faceData.confidence >= confidenceThreshold && !isProcessing) {
        handleAutoCapture();
      }
    } else {
      setIsFaceInFrame(false);
      setFacePosition(null);
    }
  }, [autoCapture, confidenceThreshold, isProcessing, handleAutoCapture]);

  const manualCapture = async () => {
    if (isProcessing || !camera.current) return;
    
    setIsProcessing(true);
    try {
      const photo = await camera.current.takePhoto();
      
      await processCapturedImage(photo.path);
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    } finally {
      setIsProcessing(false);
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'detection':
        return 'Real-time Face Detection';
      case 'registration':
        return 'Register Employee';
      case 'verification':
        return 'Real-time Face Verification';
      default:
        return 'Real-time Face Recognition';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'detection':
        return 'Position your face in the frame for detection';
      case 'registration':
        return `Registering ${employeeName || 'employee'} face`;
      case 'verification':
        return 'Verify your identity by positioning your face';
      default:
        return 'Position your face in the frame';
    }
  };

  const getStatusMessage = () => {
    if (isProcessing) {
      return 'Processing...';
    }
    
    if (lastDetection) {
      if (lastDetection.error) {
        return lastDetection.error;
      }
      
      const confidence = Math.round(lastDetection.confidence * 100);
      switch (mode) {
        case 'detection':
          return `Face detected (${confidence}% confidence)`;
        case 'registration':
          return `Employee registered (${confidence}% confidence)`;
        case 'verification':
          return lastDetection.detected
            ? `Identity verified (${confidence}% confidence)`
            : 'Identity not recognized';
        default:
          return `Face detected (${confidence}% confidence)`;
      }
    }
    
    if (isFaceInFrame) {
      return 'Face detected - hold still';
    }
    
    return 'Position your face in the frame';
  };

  const getStatusColor = () => {
    if (isProcessing) return '#007AFF';
    if (lastDetection?.error) return '#F44336';
    if (lastDetection?.detected) {
      if (mode === 'verification' && !lastDetection.detected) {
        return '#F44336';
      }
      return '#4CAF50';
    }
    if (isFaceInFrame) return '#FF9800';
    return '#FFFFFF';
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={48} color="#007AFF" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onClose}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={48} color="#F44336" />
          <Text style={styles.permissionText}>Camera not available</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        frameProcessor={frameProcessor}
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

          {/* Face Detection Frame */}
          <View style={styles.frameContainer}>
            <View style={styles.frame} />
            
            {/* Face Detection Box */}
            {facePosition && (
              <>
                {lastDetection?.personName && lastDetection.detected && (
                  <View style={{
                    position: 'absolute',
                    left: facePosition.x,
                    top: facePosition.y - 30,
                    width: facePosition.width,
                    alignItems: 'center',
                  }}>
                    <Text style={styles.personNameText}>{lastDetection.personName}</Text>
                  </View>
                )}
                <Animated.View
                  style={[
                    styles.faceBox,
                    {
                      left: facePosition.x,
                      top: facePosition.y,
                      width: facePosition.width,
                      height: facePosition.height,
                      opacity: faceBoxAnim,
                    },
                  ]}
                />
              </>
            )}
            
            {/* Pulse Ring when face is detected */}
            {isFaceInFrame && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
            )}
          </View>

          {/* Status Display */}
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusMessage()}
            </Text>
            {detectionCount > 0 && (
              <Text style={styles.detectionCount}>
                Detections: {detectionCount}
              </Text>
            )}
          </View>

          {/* Bottom Controls */}
          <View style={styles.controls}>
            <View style={styles.placeholder} />
            
            <TouchableOpacity 
              style={[
                styles.captureButton, 
                (isProcessing || !isFaceInFrame) && styles.disabledButton
              ]} 
              onPress={manualCapture}
              disabled={isProcessing || !isFaceInFrame}
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
      </Camera>
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
  faceBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  pulseRing: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 3,
    borderColor: '#FF9800',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  detectionCount: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  personNameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
}); 