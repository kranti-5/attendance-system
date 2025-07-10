import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

export default function SettingsScreen() {
  const [isEnabled, setIsEnabled] = React.useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Enable Notifications</Text>
        <Switch value={isEnabled} onValueChange={setIsEnabled} />
      </View>
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Dark Mode</Text>
        <Switch value={false} disabled />
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
}); 