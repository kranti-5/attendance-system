import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SalaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Salary & Payroll</Text>
      <View style={styles.payrollBox}>
        <Text style={styles.label}>Total Payroll</Text>
        <Text style={styles.value}>₹2,10,000</Text>
      </View>
      <View style={styles.payrollBox}>
        <Text style={styles.label}>This Month</Text>
        <Text style={styles.value}>₹1,80,000</Text>
      </View>
      <View style={styles.payrollBox}>
        <Text style={styles.label}>Pending</Text>
        <Text style={styles.value}>₹30,000</Text>
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
  payrollBox: {
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