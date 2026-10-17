import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import { useOrientation } from '../hooks/useOrientation';
import { ResponsiveContainer, FormSection } from '../components/ResponsiveContainer';
import { createResponsiveStyles } from '../utils/responsiveStyles';
import { ORIENTATION_CONFIGS } from '../config/orientation.config';
import {
  getBaseURL,
  getHostIP,
  API_CONFIG,
  setCustomServerURL,
  getCustomServerURL,
  testServerConnection,
} from '../config/api.config';

export default function AuthScreen({ navigation, route }: any) {
  const { login } = useAuth();
  const responsive = useResponsive();
  const styles = createResponsiveStyles(responsive);
  const { width, height } = useOrientation();

  const isLandscape = width > height;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  // Server connection states
  const [showServerModal, setShowServerModal] = useState(false);
  const [currentBaseURL, setCurrentBaseURL] = useState(getBaseURL());
  const [serverInput, setServerInput] = useState(getCustomServerURL() || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);

  const checkServerHealth = useCallback(async () => {
    const res = await testServerConnection();
    setIsServerOnline(res.success);
    setCurrentBaseURL(getBaseURL());
  }, []);

  useEffect(() => {
    checkServerHealth();
  }, [checkServerHealth]);

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

  const handleTestConnection = async (target?: string) => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    const result = await testServerConnection(target);
    setTestingConnection(false);
    if (result.success) {
      setConnectionTestResult({
        success: true,
        message: `Connected successfully (${result.latency}ms)`,
      });
      setIsServerOnline(true);
    } else {
      setConnectionTestResult({
        success: false,
        message: result.error || 'Connection failed',
      });
      setIsServerOnline(false);
    }
  };

  const handleSaveServerConfig = async () => {
    const trimmed = serverInput.trim();
    await setCustomServerURL(trimmed || null);
    const newBase = getBaseURL();
    setCurrentBaseURL(newBase);
    setShowServerModal(false);
    checkServerHealth();
    Alert.alert('Server Updated', `Active API URL:\n${newBase}`);
  };

  const handleResetToAuto = async () => {
    await setCustomServerURL(null);
    setServerInput('');
    const newBase = getBaseURL();
    setCurrentBaseURL(newBase);
    setConnectionTestResult(null);
    checkServerHealth();
    Alert.alert('Reset to Auto', `Using auto-detected Wi-Fi host:\n${newBase}`);
  };

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
        // Navigate to QR binding screen or process binding based on user role
        console.log('Processing QR code binding:', qrCode);
        Alert.alert('Success', 'QR code will be processed.');
      }
    } catch (error: any) {
      if (!error.response) {
        Alert.alert(
          'Network Error',
          `Cannot connect to backend server at:\n${getBaseURL()}\n\nPossible causes:\n• Your computer received a new IP after switching Wi-Fi\n• Your phone and PC are on different Wi-Fi networks\n• Router blocks device-to-device communication\n\nWould you like to open Server Settings to check or update the IP?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Server Settings',
              onPress: () => {
                setServerInput(getCustomServerURL() || '');
                setConnectionTestResult(null);
                setShowServerModal(true);
              },
            },
          ]
        );
      } else {
        Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
      }
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

          {/* Server Connection Badge */}

        </View>
      </View>

      {/* Server Configuration Modal */}
      <Modal
        visible={showServerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServerModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={authStyles.modalOverlay}
        >
          <View style={authStyles.modalCard}>
            <View style={authStyles.modalHeader}>
              <Text style={authStyles.modalTitle}>Server Configuration</Text>
              <TouchableOpacity
                onPress={() => setShowServerModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={authStyles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={authStyles.modalSubtitle}>
                When switching Wi-Fi networks, your PC's IP address changes. The app auto-detects it via Expo, or you can set a custom host.
              </Text>

              {/* Detected IP Info Box */}
              <View style={authStyles.infoBox}>
                <Text style={authStyles.infoBoxLabel}>Detected Wi-Fi Host:</Text>
                <Text style={authStyles.infoBoxValue}>
                  {getHostIP()}:{API_CONFIG.PORT}
                </Text>
                <Text style={authStyles.infoBoxHint}>
                  Host PC on current Wi-Fi network
                </Text>
              </View>

              {/* Custom API URL input */}
              <Text style={authStyles.inputLabel}>Custom Server URL (optional):</Text>
              <TextInput
                style={authStyles.modalInput}
                placeholder={`http://${getHostIP()}:${API_CONFIG.PORT}/api`}
                placeholderTextColor="#94a3b8"
                value={serverInput}
                onChangeText={setServerInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={authStyles.inputHint}>
                Leave blank to auto-detect from Wi-Fi. Supports ngrok or tunnel URLs.
              </Text>

              {/* Test Result Message */}
              {connectionTestResult && (
                <View
                  style={[
                    authStyles.testResultBox,
                    connectionTestResult.success ? authStyles.testResultSuccess : authStyles.testResultError,
                  ]}
                >
                  <Text
                    style={[
                      authStyles.testResultText,
                      connectionTestResult.success ? authStyles.testResultTextSuccess : authStyles.testResultTextError,
                    ]}
                  >
                    {connectionTestResult.success ? '✓ ' : '✕ '}
                    {connectionTestResult.message}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <TouchableOpacity
                style={authStyles.testButton}
                onPress={() => handleTestConnection(serverInput || undefined)}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <ActivityIndicator color="#1d64c1" size="small" />
                ) : (
                  <Text style={authStyles.testButtonText}>Test Connection</Text>
                )}
              </TouchableOpacity>

              <View style={authStyles.buttonRow}>
                <TouchableOpacity
                  style={authStyles.resetButton}
                  onPress={handleResetToAuto}
                >
                  <Text style={authStyles.resetButtonText}>Auto-Detect</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={authStyles.saveButton}
                  onPress={handleSaveServerConfig}
                >
                  <Text style={authStyles.saveButtonText}>Apply & Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  serverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 18,
    alignSelf: 'center',
    maxWidth: '95%',
  },
  serverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
    marginRight: 8,
  },
  serverDotGreen: {
    backgroundColor: '#10b981',
  },
  serverDotRed: {
    backgroundColor: '#ef4444',
  },
  serverBadgeText: {
    fontSize: 12,
    color: '#64748b',
    flexShrink: 1,
    marginRight: 6,
  },
  serverBadgeChange: {
    fontSize: 12,
    color: '#1d64c1',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalClose: {
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: '600',
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoBoxLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoBoxValue: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#1d64c1',
    marginBottom: 4,
  },
  infoBoxHint: {
    fontSize: 11,
    color: '#94a3b8',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 14,
  },
  testResultBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  testResultSuccess: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  testResultError: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  testResultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testResultTextSuccess: {
    color: '#15803d',
  },
  testResultTextError: {
    color: '#b91c1c',
  },
  testButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  testButtonText: {
    fontSize: 14,
    color: '#1d64c1',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1d64c1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});
