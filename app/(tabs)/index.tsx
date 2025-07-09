import CameraView from '@/components/CameraView';
import { AttendanceRecord, attendanceService, Employee } from '@/services/AttendanceService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AttendanceScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [stats, setStats] = useState({
    totalRecords: 0,
    checkIns: 0,
    checkOuts: 0,
    verifiedRecords: 0,
    pendingRecords: 0,
  });

  useEffect(() => {
    loadEmployees();
    loadTodayAttendance();
    loadStats();
  }, []);

  const loadEmployees = async () => {
    try {
      const employeeList = await attendanceService.getEmployees();
      setEmployees(employeeList);
      // Set first employee as default if available
      if (employeeList.length > 0 && !selectedEmployee) {
        setSelectedEmployee(employeeList[0]);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadTodayAttendance = async () => {
    if (!selectedEmployee) return;
    
    try {
      const records = await attendanceService.getTodayAttendance(selectedEmployee.id);
      setTodayRecords(records);
    } catch (error) {
      console.error('Error loading today\'s attendance:', error);
    }
  };

  const loadStats = async () => {
    if (!selectedEmployee) return;
    
    try {
      const statsData = await attendanceService.getAttendanceStats(selectedEmployee.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeSelector(false);
    // Reload data for selected employee
    loadTodayAttendance();
    loadStats();
  };

  const handleMarkAttendance = () => {
    if (!selectedEmployee) {
      Alert.alert('No Employee Selected', 'Please select an employee first.');
      return;
    }
    setShowCamera(true);
  };

  const handlePhotoTaken = async (photoUri: string) => {
    setShowCamera(false);
    setIsProcessing(true);

    try {
      // Use the enhanced face recognition system with specific employee verification
      const result = await attendanceService.markAttendanceWithFaceVerification(
        photoUri,
        selectedEmployee?.id
      );

      if (result.success) {
        Alert.alert('Success', result.message);
        loadTodayAttendance();
        loadStats();
      } else {
        Alert.alert(
          'Recognition Failed',
          result.message,
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

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!selectedEmployee) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading employee data...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.employeeInfo}>
          <Image
            source={{ uri: selectedEmployee.photoUri }}
            style={styles.employeePhoto}
            contentFit="cover"
          />
          <View style={styles.employeeDetails}>
            <Text style={styles.employeeName}>{selectedEmployee.name}</Text>
            <Text style={styles.employeePosition}>{selectedEmployee.position}</Text>
          </View>
          <TouchableOpacity
            style={styles.changeEmployeeButton}
            onPress={() => setShowEmployeeSelector(true)}
          >
            <Ionicons name="swap-horizontal" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="log-in" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.checkIns}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="log-out" size={24} color="#F44336" />
          <Text style={styles.statNumber}>{stats.checkOuts}</Text>
          <Text style={styles.statLabel}>Check-outs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
          <Text style={styles.statNumber}>{stats.verifiedRecords}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
      </View>

      {/* Attendance Button */}
      <View style={styles.attendanceSection}>
        <TouchableOpacity
          style={styles.attendanceButton}
          onPress={handleMarkAttendance}
          disabled={isProcessing}
        >
          <Ionicons name="camera" size={32} color="white" />
          <Text style={styles.attendanceButtonText}>
            {isProcessing ? 'Processing...' : 'Mark Attendance'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.attendanceNote}>
          Face will be verified against {selectedEmployee.name}&apos;s registered photo
        </Text>
      </View>

      {/* Today's Records */}
      <View style={styles.recordsSection}>
        <Text style={styles.sectionTitle}>Today&apos;s Attendance</Text>
        {todayRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No attendance records today</Text>
          </View>
        ) :
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
              {record.confidence && (
                <Text style={styles.confidenceText}>
                  Confidence: {(record.confidence * 100).toFixed(1)}%
                </Text>
              )}
              {record.photoUri && (
                <Image
                  source={{ uri: record.photoUri }}
                  style={styles.recordPhoto}
                  contentFit="cover"
                />
              )}
            </View>
          ))
        }
      </View>

      {/* Employee Selector Modal */}
      <Modal
        visible={showEmployeeSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEmployeeSelector(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Employee</Text>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {employees.map((employee) => (
              <TouchableOpacity
                key={employee.id}
                style={[
                  styles.employeeSelectorCard,
                  selectedEmployee?.id === employee.id && styles.selectedEmployeeCard
                ]}
                onPress={() => handleEmployeeSelect(employee)}
              >
                <Image
                  source={{ uri: employee.photoUri }}
                  style={styles.employeeSelectorPhoto}
                  contentFit="cover"
                />
                <View style={styles.employeeSelectorInfo}>
                  <Text style={styles.employeeSelectorName}>{employee.name}</Text>
                  <Text style={styles.employeeSelectorPosition}>{employee.position}</Text>
                </View>
                {selectedEmployee?.id === employee.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

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
        transparent={true}
        animationType="fade"
      >
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>Processing Attendance</Text>
            <Text style={styles.processingSubtext}>
              Verifying face recognition for {selectedEmployee?.name}...
            </Text>
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
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  employeePosition: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  changeEmployeeButton: {
    padding: 10,
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
  attendanceNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  employeeSelectorCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedEmployeeCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  employeeSelectorPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  employeeSelectorInfo: {
    flex: 1,
  },
  employeeSelectorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  employeeSelectorPosition: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
