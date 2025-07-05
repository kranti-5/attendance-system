import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import CameraView from '@/components/CameraView';
import { attendanceService, AttendanceRecord } from '@/services/AttendanceService';

export default function AttendanceScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    checkIns: 0,
    checkOuts: 0,
    verifiedRecords: 0,
    pendingRecords: 0,
  });

  // Demo worker data
  const currentWorker = {
    id: 'worker_001',
    name: 'John Doe',
    position: 'Software Developer',
  };

  useEffect(() => {
    loadTodayAttendance();
    loadStats();
  }, []);

  const loadTodayAttendance = async () => {
    try {
      const records = await attendanceService.getTodayAttendance(currentWorker.id);
      setTodayRecords(records);
    } catch (error) {
      console.error('Error loading today\'s attendance:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await attendanceService.getAttendanceStats(currentWorker.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handlePhotoTaken = async (photoUri: string) => {
    setShowCamera(false);
    setIsProcessing(true);

    try {
      // Simulate face recognition
      const recognition = await attendanceService.recognizeFace(photoUri);

      if (recognition.recognized) {
        // Determine if this should be check-in or check-out
        const hasCheckedIn = await attendanceService.hasCheckedInToday(currentWorker.id);
        const hasCheckedOut = await attendanceService.hasCheckedOutToday(currentWorker.id);

        let attendanceType: 'check-in' | 'check-out';
        let message: string;

        if (!hasCheckedIn) {
          attendanceType = 'check-in';
          message = 'Check-in successful!';
        } else if (!hasCheckedOut) {
          attendanceType = 'check-out';
          message = 'Check-out successful!';
        } else {
          Alert.alert('Already Complete', 'You have already checked in and out today.');
          setIsProcessing(false);
          return;
        }

        // Add attendance record
        await attendanceService.addAttendanceRecord({
          workerId: currentWorker.id,
          workerName: currentWorker.name,
          type: attendanceType,
          photoUri,
          status: 'pending',
        });

        Alert.alert('Success', message);
        loadTodayAttendance();
        loadStats();
      } else {
        Alert.alert(
          'Recognition Failed',
          'Face not recognized. Please try again or contact your administrator.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process attendance. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#007AFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{currentWorker.name}</Text>
            <Text style={styles.position}>{currentWorker.position}</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>{stats.totalRecords}</Text>
          <Text style={styles.statLabel}>Total Records</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.verifiedRecords}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{stats.pendingRecords}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Attendance Button */}
      <View style={styles.attendanceSection}>
        <TouchableOpacity
          style={styles.attendanceButton}
          onPress={() => setShowCamera(true)}
          disabled={isProcessing}
        >
          <Ionicons name="camera" size={32} color="white" />
          <Text style={styles.attendanceButtonText}>
            {isProcessing ? 'Processing...' : 'Mark Attendance'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today's Records */}
      <View style={styles.recordsSection}>
        <Text style={styles.sectionTitle}>Today's Attendance</Text>
        {todayRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No attendance records today</Text>
          </View>
        ) : (
          todayRecords.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.recordType}>
                  <Ionicons
                    name={record.type === 'check-in' ? 'log-in' : 'log-out'}
                    size={20}
                    color={record.type === 'check-in' ? '#4CAF50' : '#F44336'}
                  />
                  <Text style={[
                    styles.recordTypeText,
                    { color: record.type === 'check-in' ? '#4CAF50' : '#F44336' }
                  ]}>
                    {record.type === 'check-in' ? 'Check In' : 'Check Out'}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(record.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {getStatusText(record.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.recordTime}>
                {formatTime(record.timestamp)}
              </Text>
              {record.photoUri && (
                <Image
                  source={{ uri: record.photoUri }}
                  style={styles.recordPhoto}
                  contentFit="cover"
                />
              )}
            </View>
          ))
        )}
      </View>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CameraView
          onPhotoTaken={handlePhotoTaken}
          onClose={() => setShowCamera(false)}
        />
      </Modal>

      {/* Processing Modal */}
      <Modal
        visible={isProcessing}
        transparent
        animationType="fade"
      >
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>Processing attendance...</Text>
            <Text style={styles.processingSubtext}>Please wait while we verify your identity</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  position: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  attendanceSection: {
    padding: 20,
  },
  attendanceButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  attendanceButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  recordsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginTop: 10,
  },
  recordCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordTypeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordTime: {
    fontSize: 14,
    color: '#666',
  },
  recordPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginTop: 10,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 250,
  },
  processingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
});
