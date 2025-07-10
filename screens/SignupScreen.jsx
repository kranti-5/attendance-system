import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Image,
  CheckBox,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

function SwiftvisionLogo({ style }) {
  return (
    <View style={[{ width: 48, height: 48, backgroundColor: '#e3f0fc', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Image
        source={require('../assets/swiftvision-icon.png')}
        style={{ width: 40, height: 40, borderRadius: 20 }}
        resizeMode="contain"
      />
    </View>
  );
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (score <= 2) return { label: 'Weak', color: '#e57373' };
  if (score === 3 || score === 4) return { label: 'Medium', color: '#ffb300' };
  if (score === 5) return { label: 'Strong', color: '#43a047' };
  return { label: '', color: '#ccc' };
}

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setProfilePhoto(result.assets[0]);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required.';
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) newErrors.email = 'Invalid email address.';
    if (!password) newErrors.password = 'Password is required.';
    else {
      if (password.length < 8) newErrors.password = 'At least 8 characters.';
      else if (!/[A-Z]/.test(password)) newErrors.password = 'Must have uppercase letter.';
      else if (!/[a-z]/.test(password)) newErrors.password = 'Must have lowercase letter.';
      else if (!/\d/.test(password)) newErrors.password = 'Must have a digit.';
      else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) newErrors.password = 'Must have a special character.';
    }
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm your password.';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!profilePhoto) newErrors.profilePhoto = 'Profile photo is required.';
    if (!agree) newErrors.agree = 'You must agree to the Terms and Privacy Policy.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost/Demo/mobile-app/backend/signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username.trim(),
          emailOrMobile: email.trim(),
          password: password,
          profilePhoto: profilePhoto ? profilePhoto.base64 : null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Account created successfully!');
        navigation.navigate('Login');
      } else {
        setErrors({ api: data.error || 'Signup failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ api: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <View style={styles.bg}>
      <View style={styles.container}>
        <View style={styles.logoBox}>
          <SwiftvisionLogo />
        </View>
        <Text style={styles.heading}>Create an account</Text>
        <View style={{ width: '100%' }}>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Text style={styles.photoButtonText}>
              {profilePhoto ? 'Retake Photo' : 'Take Profile Photo'}
            </Text>
          </TouchableOpacity>
          {profilePhoto && (
            <Image
              source={{ uri: profilePhoto.uri }}
              style={{ width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 10 }}
            />
          )}
          {errors.profilePhoto && <Text style={styles.error}>{errors.profilePhoto}</Text>}
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholderTextColor="#b0b8c1"
          />
          {errors.username && <Text style={styles.error}>{errors.username}</Text>}
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#b0b8c1"
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#b0b8c1"
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flex: 1, height: 6, backgroundColor: passwordStrength.color, borderRadius: 3, marginRight: 8 }} />
            <Text style={{ color: passwordStrength.color, fontSize: 12 }}>{passwordStrength.label}</Text>
          </View>
          {errors.password && <Text style={styles.error}>{errors.password}</Text>}
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor="#b0b8c1"
          />
          {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}
          <View style={styles.checkboxRow}>
            <CheckBox
              value={agree}
              onValueChange={setAgree}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.checkboxText}>
              I agree to the{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://expo.dev/terms')}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://expo.dev/privacy')}>Privacy Policy</Text>
              .
            </Text>
          </View>
          {errors.agree && <Text style={styles.error}>{errors.agree}</Text>}
          {errors.api && <Text style={styles.error}>{errors.api}</Text>}
          <TouchableOpacity
            style={[styles.button, (loading || !agree) && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading || !agree}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loginBox}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 16,
    fontFamily: 'Segoe UI, Arial',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 46,
    borderColor: '#e3eafc',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f7fafd',
    color: '#222',
    fontFamily: 'Segoe UI, Arial',
  },
  photoButton: {
    width: '100%',
    height: 40,
    backgroundColor: '#e3f0fc',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#b0b8c1',
  },
  photoButtonText: {
    color: '#1976d2',
    fontWeight: '600',
    fontSize: 15,
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
  buttonDisabled: {
    backgroundColor: '#b0b8c1',
    opacity: 0.7,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  link: {
    color: '#4f8cff',
    textDecorationLine: 'underline',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 10,
  },
});