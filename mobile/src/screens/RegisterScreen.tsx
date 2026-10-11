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
} from 'react-native';
import api from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import { useOrientation } from '../hooks/useOrientation';
import { ResponsiveContainer, FormSection } from '../components/ResponsiveContainer';
import { createResponsiveStyles } from '../utils/responsiveStyles';

export default function RegisterScreen({ navigation }: any) {
  const responsive = useResponsive();
  const styles = createResponsiveStyles(responsive);
  
  // Lock register screen to portrait mode (useOrientation doesn't accept arguments)
  useOrientation();
  
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (form.password !== form.confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/public-register', {
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
      });
      Alert.alert('Success', 'Account created! Please login.');
      navigation.navigate('Auth');
    } catch (error: any) {
      console.log('Registration error:', error.response?.data);
      const message = error.response?.data?.message || error.message || 'Internal Server Error';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveContainer
      scrollable
      avoidKeyboard
      horizontalPadding
      verticalPadding
    >
      <View style={styles.centerContent}>
        <Text style={styles.heading1}>PMed-Aid</Text>
        <Text style={[styles.heading3, { marginBottom: responsive.spacing.lg }]}>
          Create Account
        </Text>

        <FormSection gap={responsive.spacing.md}>
          <TextInput
            style={[styles.inputLarge, { fontSize: responsive.fontSize.md }]}
            placeholder="First Name"
            placeholderTextColor="#cbd5e1"
            value={form.first_name}
            onChangeText={(text) => setForm({ ...form, first_name: text })}
            editable={!loading}
          />

          <TextInput
            style={[styles.inputLarge, { fontSize: responsive.fontSize.md }]}
            placeholder="Last Name"
            placeholderTextColor="#cbd5e1"
            value={form.last_name}
            onChangeText={(text) => setForm({ ...form, last_name: text })}
            editable={!loading}
          />

          <TextInput
            style={[styles.inputLarge, { fontSize: responsive.fontSize.md }]}
            placeholder="Email"
            placeholderTextColor="#cbd5e1"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={[styles.inputLarge, { fontSize: responsive.fontSize.md }]}
            placeholder="Password"
            placeholderTextColor="#cbd5e1"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={[styles.inputLarge, { fontSize: responsive.fontSize.md }]}
            placeholder="Confirm Password"
            placeholderTextColor="#cbd5e1"
            value={form.confirm}
            onChangeText={(text) => setForm({ ...form, confirm: text })}
            secureTextEntry
            editable={!loading}
          />
        </FormSection>

        <TouchableOpacity
          style={[styles.buttonLarge, loading && registerStyles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: responsive.spacing.lg }}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.bodyRegular}>
            Already have an account?{' '}
            <Text style={{ color: '#1d64c1', fontWeight: '600' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ResponsiveContainer>
  );
}

const registerStyles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.6,
  },
});
