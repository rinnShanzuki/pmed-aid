import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import { useOrientation } from '../hooks/useOrientation';
import { ResponsiveContainer, FormSection } from '../components/ResponsiveContainer';
import { createResponsiveStyles } from '../utils/responsiveStyles';
import { ORIENTATION_CONFIGS } from '../config/orientation.config';

export default function AuthScreen({ navigation, route }: any) {
  const { login } = useAuth();
  const responsive = useResponsive();
  const styles = createResponsiveStyles(responsive);
  const { width, height } = useOrientation();
  
  // Lock auth screen to portrait mode
  // Note: We'll allow landscape but optimize the layout for it
  // useOrientation(ORIENTATION_CONFIGS.AUTH);
  
  const isLandscape = width > height;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    // Check if we received a QR code from deep link
    if (route?.params?.qrCode) {
      setQrCode(route.params.qrCode);
      Alert.alert(
        'QR Code Scanned',
        'Please log in with your credentials to proceed.'
      );
    }
  }, [route?.params?.qrCode]);

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
      
      // If we have a QR code from deep link, trigger QR binding
      if (qrCode) {
        console.log('Processing QR code binding:', qrCode);
        Alert.alert('Success', 'QR code will be processed.');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic card width for landscape
  const cardMaxWidth = isLandscape ? Math.min(400, width * 0.6) : '100%';
  const cardPadding = isLandscape ? responsive.spacing.md : responsive.spacing.lg;

  return (
    <ResponsiveContainer
      scrollable
      avoidKeyboard
      horizontalPadding={!isLandscape}
      verticalPadding
    >
      {/* Container for centering in landscape */}
      <View
        style={[
          styles.centerContent,
          isLandscape && {
            justifyContent: 'center',
            paddingHorizontal: responsive.spacing.md,
          },
        ]}
      >
        {/* Login Card */}
        <View
          style={[
            authStyles.loginCard,
            {
              padding: cardPadding,
              width: cardMaxWidth,
              maxWidth: 450,
            },
          ]}
        >
          <Text
            style={[
              styles.heading2,
              authStyles.welcomeBack,
              { fontSize: 24 }, // Fixed font size - consistent across orientations
            ]}
          >
            Welcome back
          </Text>

          {qrCode && (
            <View
              style={[
                authStyles.qrBanner,
                { padding: responsive.spacing.md },
              ]}
            >
              <Text
                style={[
                  authStyles.qrBannerText,
                  { fontSize: 14 }, // Fixed font size
                ]}
              >
                📱 QR Code Scanned
              </Text>
            </View>
          )}

          <FormSection gap={responsive.spacing.md}>
            <View>
              <Text
                style={[
                  styles.label,
                  { fontSize: 14 }, // Fixed font size
                ]}
              >
                Email address
              </Text>
              <TextInput
                style={[
                  styles.inputLarge,
                  {
                    fontSize: 16, // Fixed font size
                    minHeight: 48,
                  },
                ]}
                placeholder="Enter email"
                placeholderTextColor="#cbd5e1"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View>
              <Text
                style={[
                  styles.label,
                  { fontSize: 14 }, // Fixed font size
                ]}
              >
                Password
              </Text>
              <View style={authStyles.passwordContainer}>
                <TextInput
                  style={[
                    styles.inputLarge,
                    {
                      flex: 1,
                      fontSize: 16, // Fixed font size
                      minHeight: 48,
                    },
                  ]}
                  placeholder="Enter Password"
                  placeholderTextColor="#cbd5e1"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={authStyles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={authStyles.eyeText}>{showPassword ? '👁' : '👁‍🗨'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </FormSection>

          <TouchableOpacity
            style={authStyles.checkboxContainer}
            onPress={() => setAgreeTerms(!agreeTerms)}
          >
            <View
              style={[
                authStyles.checkbox,
                agreeTerms && authStyles.checkboxChecked,
              ]}
            >
              {agreeTerms && (
                <Text style={authStyles.checkmark}>✓</Text>
              )}
            </View>
            <Text
              style={[
                styles.bodySmall,
                {
                  flex: 1,
                  fontSize: 14, // Fixed font size
                  lineHeight: 20,
                },
              ]}
            >
              I agree to the Terms and Conditions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buttonLarge,
              loading && authStyles.buttonDisabled,
              {
                minHeight: 48,
                marginVertical: responsive.spacing.md,
              },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text
              style={[
                styles.buttonText,
                { fontSize: 16 }, // Fixed font size
              ]}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              authStyles.dividerText,
              {
                marginVertical: responsive.spacing.md,
                fontSize: 14, // Fixed font size
              },
            ]}
          >
            Or continue with
          </Text>

          <TouchableOpacity style={authStyles.googleButton} disabled>
            <Text
              style={[
                authStyles.googleIcon,
                { fontSize: 20 }, // Fixed font size
              ]}
            >
              G
            </Text>
            <Text
              style={[
                authStyles.googleText,
                { fontSize: 16 }, // Fixed font size
              ]}
            >
              Sign In with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text
              style={[
                authStyles.signUpText,
                { fontSize: 14 }, // Fixed font size
              ]}
            >
              Don't have an account?{' '}
              <Text style={authStyles.signUpLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ResponsiveContainer>
  );
}

const authStyles = StyleSheet.create({
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeBack: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 24, // Fixed
    fontWeight: '600',
    color: '#334155',
  },
  qrBanner: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1d64c1',
  },
  qrBannerText: {
    color: '#1d64c1',
    fontSize: 14, // Fixed
    fontWeight: '600',
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    minHeight: 48,
  },
  eyeIcon: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 20, // Fixed
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginVertical: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1d64c1',
    borderColor: '#1d64c1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14, // Fixed
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14, // Fixed
    marginVertical: 20,
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
    minHeight: 48,
  },
  googleIcon: {
    fontSize: 20, // Fixed
    fontWeight: 'bold',
    color: '#1d64c1',
    marginRight: 12,
  },
  googleText: {
    color: '#64748b',
    fontSize: 16, // Fixed
    fontWeight: '500',
  },
  signUpText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14, // Fixed
    marginTop: 16,
    lineHeight: 20,
  },
  signUpLink: {
    color: '#1d64c1',
    fontWeight: '600',
  },
});
