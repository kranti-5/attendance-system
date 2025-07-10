import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.widgetRow}>
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>Staff</Text>
          <Text style={styles.widgetValue}>42</Text>
        </View>
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>Present</Text>
          <Text style={styles.widgetValue}>39</Text>
        </View>
      </View>
      <View style={styles.widgetRow}>
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>Absent</Text>
          <Text style={styles.widgetValue}>3</Text>
        </View>
        <View style={styles.widget}>
          <Text style={styles.widgetTitle}>Payroll</Text>
          <Text style={styles.widgetValue}>₹2,10,000</Text>
        </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#1a237e',
  },
  widgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  widget: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  widgetTitle: {
    fontSize: 16,
    color: '#1976d2',
    marginBottom: 8,
  },
  widgetValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
  },
}); 