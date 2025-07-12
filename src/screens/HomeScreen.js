import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Platform, ScrollView } from 'react-native';
import { Button, Card, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    setIsLoading(true);
    try {
      // Fetch employee count
      const employeesResponse = await fetch('http://192.168.29.195:5000/employees');
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployeeCount(employeesData.employees?.length || 0);
      }

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const attendanceResponse = await fetch(`http://192.168.29.195:5000/attendance/${today}`);
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        setTodayAttendance(attendanceData.attendance?.length || 0);
      }
    } catch (error) {
      console.log('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.titleContainer}>
            <MaterialIcons name="face" size={40} color="#2196F3" />
            <Text style={styles.title}>Face Recognition Attendance System</Text>
          </View>
          <Text style={styles.subtitle}>
            Secure, fast, and accurate attendance tracking using advanced facial recognition technology
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={32} color="#4CAF50" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>{isLoading ? '...' : employeeCount}</Text>
                <Text style={styles.statLabel}>Registered Employees</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statItem}>
              <MaterialIcons name="check-circle" size={32} color="#FF9800" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>{isLoading ? '...' : todayAttendance}</Text>
                <Text style={styles.statLabel}>Today's Attendance</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.featuresCard}>
        <Card.Content>
          <Text style={styles.featuresTitle}>System Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="security" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Secure face recognition technology</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="speed" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Fast and accurate identification</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="storage" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Automatic attendance records</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="web" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Web and mobile compatible</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
          icon="account-plus"
          contentStyle={styles.buttonContent}
        >
          Register New Employee
        </Button>

        <Button
          mode="contained"
          style={styles.attendanceButton}
          onPress={() => navigation.navigate('Attendance')}
          icon="camera"
          contentStyle={styles.buttonContent}
        >
          Mark Attendance
        </Button>

        <Button
          mode="outlined"
          style={styles.refreshButton}
          onPress={fetchSystemStats}
          icon="refresh"
          loading={isLoading}
          disabled={isLoading}
        >
          Refresh Stats
        </Button>
      </View>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.infoTitle}>How to Use</Text>
          <View style={styles.instructionList}>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1</Text>
              <Text style={styles.instructionText}>
                Register employees with clear, front-facing photos for best recognition accuracy
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2</Text>
              <Text style={styles.instructionText}>
                Take attendance photos in good lighting with face clearly visible
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3</Text>
              <Text style={styles.instructionText}>
                System automatically matches faces and records attendance with confidence scores
              </Text>
            </View>
          </View>
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
  headerCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    marginLeft: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    borderRadius: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    marginLeft: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  featuresCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  registerButton: {
    marginBottom: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  attendanceButton: {
    marginBottom: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  refreshButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  instructionList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default HomeScreen; 