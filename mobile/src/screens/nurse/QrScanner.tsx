import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function QrScanner() {
  const { user } = useAuth();
  const [wristbandCode, setWristbandCode] = useState('');
  const [cameraPermission, setCameraPermission] = useState(false);

  const requestCameraPermission = async () => {
    // In a real app, you would request camera permissions here
    Alert.alert(
      'Camera Permission',
      'Camera permission would be requested here. For now, you can use manual input.',
      [{ text: 'OK', onPress: () => setCameraPermission(true) }]
    );
  };

  const handleVerify = () => {
    if (!wristbandCode.trim()) {
      Alert.alert('Error', 'Please enter a wristband code');
      return;
    }
    
    Alert.alert(
      'Verification',
      `Verifying wristband code: ${wristbandCode}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => {
          // Handle verification logic here
          console.log('Verifying:', wristbandCode);
          setWristbandCode('');
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Nurse Badge */}
        <View style={styles.nurseBadge}>
          <View style={styles.nurseAvatar}>
            <Text style={styles.nurseInitials}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
          <View style={styles.nurseInfo}>
            <Text style={styles.nurseName}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.nurseRole}>Nurse</Text>
          </View>
        </View>

        {/* Main Content Card */}
        <View style={styles.contentCard}>
        {/* Camera Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.cameraIconCircle}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Scan Patient Wristband</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Point device camera at the patient's wristband QR code to verify pending medications.
        </Text>

        {/* QR Scanner Box */}
        <View style={styles.scannerBox}>
          <View style={styles.scannerContent}>
            <Text style={styles.phoneIcon}>📱</Text>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={requestCameraPermission}
            >
              <Text style={styles.permissionButtonText}>Request Camera Permissions</Text>
            </TouchableOpacity>
          </View>
          
          {/* Info Icon */}
          <View style={styles.infoIcon}>
            <Text style={styles.infoText}>ⓘ</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR MANUAL INPUT</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manual Input */}
        <View style={styles.manualInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter wristband code..."
            value={wristbandCode}
            onChangeText={setWristbandCode}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.verifyButton}
            onPress={handleVerify}
          >
            <Text style={styles.verifyButtonText}>Verify</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  nurseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    alignSelf: 'flex-end',
  },
  nurseAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  nurseInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  nurseInfo: {
    justifyContent: 'center',
  },
  nurseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  nurseRole: {
    fontSize: 13,
    color: '#64748b',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 24,
  },
  cameraIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  scannerBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
    minHeight: 200,
  },
  scannerContent: {
    alignItems: 'center',
  },
  phoneIcon: {
    fontSize: 48,
    marginBottom: 20,
    opacity: 0.3,
  },
  permissionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  infoIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  manualInputContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  verifyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
