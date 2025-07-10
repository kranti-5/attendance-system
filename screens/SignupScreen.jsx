import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

function SwiftvisionLogo({ style }) {
  return (
    <View style={[{ width: 48, height: 48, backgroundColor: '#e3f0fc', borderRadius: 24 }, style]}>
      <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 10, textAlign: 'center', marginTop: 16 }}>
        Swiftvision
      </Text>
    </View>
  );
}

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [mobileOrEmail, setMobileOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = () => {
    if (!name || !mobileOrEmail || !password || !confirmPassword) {
      setError('Please fill all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    // TODO: Add actual signup logic
  };

  const content = (
    <>
      <View style={styles.logoBox}>
        <SwiftvisionLogo />
      </View>
      <View style={{ width: '100%', alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subheading}>Sign up to get started</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        placeholderTextColor="#b0b8c1"
      />
      <TextInput
        style={styles.input}
        placeholder="Mobile number or Email"
        value={mobileOrEmail}
        onChangeText={setMobileOrEmail}
        keyboardType={Platform.OS === 'web' ? 'text' : 'default'}
        autoCapitalize="none"
        placeholderTextColor="#b0b8c1"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#b0b8c1"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor="#b0b8c1"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <View style={styles.loginBox}>
        <Text style={styles.loginText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.bg}>
      <View style={styles.container}>
        {Platform.OS === 'web' ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSignup();
            }}
            style={{ width: '100%' }}
            autoComplete="on"
          >
            {content}
          </form>
        ) : (
          content
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#f7fafd',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: 20,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 6px 32px #e3eafc' }
      : {
          shadowColor: '#bcd6f7',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.13,
          shadowRadius: 12,
        }),
  },
  logoBox: {
    backgroundColor: '#f4f8fb',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 27,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 4,
    fontFamily: 'Segoe UI, Arial',
    letterSpacing: 0.2,
  },
  subheading: {
    fontSize: 15,
    color: '#8ca0b3',
    marginBottom: 14,
    fontWeight: '400',
  },
  input: {
    width: '100%',
    height: 46,
    borderColor: '#e3eafc',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f7fafd',
    color: '#222',
    fontFamily: 'Segoe UI, Arial',
  },
  button: {
    width: '100%',
    height: 46,
    backgroundColor: '#4f8cff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 4,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 12px #e3eafc' }
      : {
          shadowColor: '#bcd6f7',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        }),
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: 0.2,
    fontFamily: 'Segoe UI, Arial',
  },
  error: {
    color: '#e57373',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  loginBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#8ca0b3',
    fontSize: 15,
    marginRight: 4,
    fontWeight: '400',
  },
  loginLink: {
    color: '#4f8cff',
    fontWeight: '600',
    fontSize: 15,
  },
});