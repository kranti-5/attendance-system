import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';

const staffData = [
  { id: '1', name: 'Amit Sharma', role: 'Manager', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: '2', name: 'Priya Singh', role: 'Accountant', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: '3', name: 'Rahul Verma', role: 'Staff', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
];

export default function StaffScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Management</Text>
      <FlatList
        data={staffData}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.staffItem}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
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
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  role: {
    fontSize: 14,
    color: '#1976d2',
  },
}); 