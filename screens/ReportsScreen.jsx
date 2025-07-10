import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports & Analytics</Text>
      <View style={styles.reportBox}>
        <Text style={styles.label}>Attendance Rate</Text>
        <Text style={styles.value}>92%</Text>
      </View>
      <View style={styles.reportBox}>
        <Text style={styles.label}>Payroll Processed</Text>
        <Text style={styles.value}>₹2,10,000</Text>
      </View>
      <View style={styles.reportBox}>
        <Text style={styles.label}>Active Staff</Text>
        <Text style={styles.value}>42</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#f7fafd',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#1a237e',
  },
  reportBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    width: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontSize: 16,
    color: '#1976d2',
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
}); 