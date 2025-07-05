import CameraView from '@/components/CameraView';
import { attendanceService, Employee } from '@/services/AttendanceService';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployeePhoto, setNewEmployeePhoto] = useState<string>('');
  const [newEmployeeData, setNewEmployeeData] = useState({
    name: '',
    position: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const employeeList = await attendanceService.getEmployees();
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeePress = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  const handleEditPhoto = () => {
    setShowCamera(true);
  };

  const handlePhotoTaken = async (photoUri: string) => {
    setShowCamera(false);
    setIsUpdatingPhoto(true);

    try {
      if (selectedEmployee) {
        // Update employee photo
        await attendanceService.updateEmployee(selectedEmployee.id, {
          photoUri: photoUri,
        });

        // Reload employees to get updated data
        await loadEmployees();

        // Update selected employee with new photo
        setSelectedEmployee({
          ...selectedEmployee,
          photoUri: photoUri,
        });

        Alert.alert('Success', 'Employee photo updated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update employee photo. Please try again.');
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const handleAddEmployeePhoto = async (photoUri: string) => {
    setShowCamera(false);
    setNewEmployeePhoto(photoUri);
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeData.name.trim() || !newEmployeeData.position.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!newEmployeePhoto) {
      Alert.alert('Error', 'Please capture a photo for the employee');
      return;
    }

    try {
      await attendanceService.addEmployee({
        name: newEmployeeData.name.trim(),
        position: newEmployeeData.position.trim(),
        photoUri: newEmployeePhoto,
        isActive: true,
      });

      await loadEmployees();
      setShowAddEmployee(false);
      setNewEmployeePhoto('');
      setNewEmployeeData({ name: '', position: '' });
      Alert.alert('Success', 'Employee added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add employee. Please try again.');
    }
  };

  const getAttendanceStats = async (employeeId: string) => {
    try {
      const stats = await attendanceService.getAttendanceStats(employeeId);
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading employees...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employee Management</Text>
        <Text style={styles.headerSubtitle}>
          Face recognition enabled employees
        </Text>
      </View>

      {/* Employee List */}
      <View style={styles.employeeList}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Registered Employees</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddEmployee(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Employee</Text>
          </TouchableOpacity>
        </View>
        {employees.map((employee) => (
          <TouchableOpacity
            key={employee.id}
            style={styles.employeeCard}
            onPress={() => handleEmployeePress(employee)}
          >
            <Image
              source={{ uri: employee.photoUri }}
              style={styles.employeePhoto}
              contentFit="cover"
            />
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{employee.name}</Text>
              <Text style={styles.employeePosition}>{employee.position}</Text>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Face Recognition Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Face Recognition System</Text>
        <View style={styles.infoCard}>
          <Ionicons name="camera" size={32} color="#007AFF" />
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            When marking attendance, the system captures your photo and compares it with your registered employee image using advanced face recognition technology.
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
          <Text style={styles.infoTitle}>Security Features</Text>
          <Text style={styles.infoText}>
            • 75% confidence threshold for verification{'\n'}
            • Real-time face detection{'\n'}
            • Prevents attendance fraud{'\n'}
            • Stores confidence scores
          </Text>
        </View>
      </View>

      {/* Employee Detail Modal */}
      <Modal
        visible={showEmployeeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedEmployee && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEmployeeModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Employee Details</Text>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.photoSection}>
                <Image
                  source={{ uri: selectedEmployee.photoUri }}
                  style={styles.modalEmployeePhoto}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.editPhotoButton}
                  onPress={handleEditPhoto}
                  disabled={isUpdatingPhoto}
                >
                  <Ionicons name="camera" size={20} color="white" />
                  <Text style={styles.editPhotoText}>
                    {isUpdatingPhoto ? 'Updating...' : 'Edit Photo'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalEmployeeName}>{selectedEmployee.name}</Text>
              <Text style={styles.modalEmployeePosition}>{selectedEmployee.position}</Text>
              
              <View style={styles.modalStats}>
                <Text style={styles.modalStatsTitle}>Attendance Statistics</Text>
                {/* Stats would be loaded here */}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        visible={showAddEmployee}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowAddEmployee(false);
                setNewEmployeePhoto('');
                setNewEmployeeData({ name: '', position: '' });
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Employee</Text>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.photoSection}>
              {newEmployeePhoto ? (
                <Image
                  source={{ uri: newEmployeePhoto }}
                  style={styles.modalEmployeePhoto}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Ionicons name="person" size={60} color="#ccc" />
                </View>
              )}
              <TouchableOpacity
                style={styles.editPhotoButton}
                onPress={() => setShowCamera(true)}
              >
                <Ionicons name="camera" size={20} color="white" />
                <Text style={styles.editPhotoText}>
                  {newEmployeePhoto ? 'Retake Photo' : 'Take Photo'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={newEmployeeData.name}
                onChangeText={(text) => setNewEmployeeData({ ...newEmployeeData, name: text })}
                placeholder="Enter employee name"
                placeholderTextColor="#999"
              />
              
              <Text style={styles.inputLabel}>Position</Text>
              <TextInput
                style={styles.textInput}
                value={newEmployeeData.position}
                onChangeText={(text) => setNewEmployeeData({ ...newEmployeeData, position: text })}
                placeholder="Enter employee position"
                placeholderTextColor="#999"
              />
            </View>
            
            <TouchableOpacity
              style={styles.addEmployeeButton}
              onPress={handleAddEmployee}
            >
              <Text style={styles.addEmployeeButtonText}>Add Employee</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Camera Modal for Photo Update/Add */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CameraView
          onPhotoTaken={selectedEmployee ? handlePhotoTaken : handleAddEmployeePhoto}
          onClose={() => setShowCamera(false)}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  employeeList: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  employeeCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  employeePosition: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
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
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalEmployeePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  placeholderPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  editPhotoButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editPhotoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  addEmployeeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addEmployeeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalEmployeeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalEmployeePosition: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  modalStats: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
  },
  modalStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
}); 