import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    if (!agreeTerms) {
      Alert.alert('Error', 'Please agree to the Terms and Conditions.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Blue Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoPlus}>+</Text>
            </View>
          </View>
          <Text style={styles.brandName}>PMed-Aid</Text>
          <Text style={styles.tagline}>
            Manage hospital operations, track patient medications, and connect with healthcare
            professionals in one unified platform.
          </Text>
        </View>

        {/* White Login Card */}
        <View style={styles.loginCard}>
          <Text style={styles.welcomeBack}>Welcome back</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              placeholderTextColor="#cbd5e1"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter Password"
                placeholderTextColor="#cbd5e1"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '👁' : '👁‍🗨'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreeTerms(!agreeTerms)}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
              {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>I agree to the Terms and Conditions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.dividerText}>Or continue with</Text>

          <TouchableOpacity style={styles.googleButton} disabled>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Sign In with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signUpText}>
              Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  headerCard: {
    backgroundColor: '#1d64c1',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlus: {
    fontSize: 60,
    color: '#1d64c1',
    fontWeight: 'bold',
  },
  brandName: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tagline: {
    color: '#e0f2fe',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
  },
  welcomeBack: {
    fontSize: 24,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    color: '#0f172a',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  eyeIcon: {
    padding: 10,
  },
  eyeText: {
    fontSize: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1d64c1',
    borderColor: '#1d64c1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  signInButton: {
    backgroundColor: '#1d64c1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d64c1',
    marginRight: 12,
  },
  googleText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  signUpText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  },
  signUpLink: {
    color: '#1d64c1',
    fontWeight: '600',
  },
});
