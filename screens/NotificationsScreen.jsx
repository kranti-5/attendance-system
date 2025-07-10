import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const notifications = [
  { id: '1', message: 'Salary credited for June.' },
  { id: '2', message: 'Attendance marked successfully.' },
  { id: '3', message: 'New staff member added: Priya Singh.' },
];

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.notificationBox}>
            <Text style={styles.message}>{item.message}</Text>
          </View>
        )}
      />
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
  notificationBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  message: {
    fontSize: 16,
    color: '#333',
  },
}); 