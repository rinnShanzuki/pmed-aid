import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function SystemSettings() {
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [reminderLeadTime, setReminderLeadTime] = useState('30');

  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [minPasswordLength, setMinPasswordLength] = useState('8');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');

  // QR Code Settings
  const [qrCodeExpiry, setQrCodeExpiry] = useState('30');
  const [autoGenerateQR, setAutoGenerateQR] = useState(true);
  const [qrBindingLimit, setQrBindingLimit] = useState('1');

  const handleSaveSettings = () => {
    Alert.alert('Success', 'All settings saved successfully!');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerIcon}>⚙️</Text>
          <Text style={styles.headerTitle}>System Settings</Text>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
          <Text style={styles.saveButtonText}>Save All Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Settings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Send medication reminders and alerts via email</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={emailNotifications ? '#3b82f6' : '#f4f4f5'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>SMS Notifications</Text>
              <Text style={styles.settingDescription}>Send text message reminders to patients</Text>
            </View>
            <Switch
              value={smsNotifications}
              onValueChange={setSmsNotifications}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={smsNotifications ? '#3b82f6' : '#f4f4f5'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Enable browser push notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={pushNotifications ? '#3b82f6' : '#f4f4f5'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Reminder Lead Time</Text>
              <Text style={styles.settingDescription}>Minutes before scheduled time to send reminder</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.numberInput}
                value={reminderLeadTime}
                onChangeText={setReminderLeadTime}
                keyboardType="number-pad"
              />
              <Text style={styles.inputUnit}>minutes</Text>
            </View>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🛡️</Text>
            <Text style={styles.sectionTitle}>Security Settings</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
              <Text style={styles.settingDescription}>Require 2FA for all admin accounts</Text>
            </View>
            <Switch
              value={twoFactorAuth}
              onValueChange={setTwoFactorAuth}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={twoFactorAuth ? '#3b82f6' : '#f4f4f5'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Session Timeout</Text>
              <Text style={styles.settingDescription}>Auto-logout after inactivity</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.numberInput}
                value={sessionTimeout}
                onChangeText={setSessionTimeout}
                keyboardType="number-pad"
              />
              <Text style={styles.inputUnit}>minutes</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Minimum Password Length</Text>
              <Text style={styles.settingDescription}>Enforce minimum password characters</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.numberInput}
                value={minPasswordLength}
                onChangeText={setMinPasswordLength}
                keyboardType="number-pad"
              />
              <Text style={styles.inputUnit}>chars</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Max Login Attempts</Text>
              <Text style={styles.settingDescription}>Lock account after failed attempts</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.numberInput}
                value={maxLoginAttempts}
                onChangeText={setMaxLoginAttempts}
                keyboardType="number-pad"
              />
              <Text style={styles.inputUnit}>attempts</Text>
            </View>
          </View>
        </View>

        {/* QR Code Settings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📱</Text>
            <Text style={styles.sectionTitle}>QR Code Settings</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>QR Code Expiry</Text>
              <Text style={styles.settingDescription}>Days before a discharge QR code expires</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.numberInput}
                value={qrCodeExpiry}
                onChangeText={setQrCodeExpiry}
                keyboardType="number-pad"
              />
              <Text style={styles.inputUnit}>days</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Generate QR on Discharge</Text>
              <Text style={styles.settingDescription}>Automatically create QR codes when patients are discharged</Text>
            </View>
            <Switch
              value={autoGenerateQR}
              onValueChange={setAutoGenerateQR}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={autoGenerateQR ? '#3b82f6' : '#f4f4f5'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>QR Binding Limit</Text>
              <Text style={styles.settingDescription}>Maximum number of accounts a single QR code can bind</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.numberInput}
                value={qrBindingLimit}
                onChangeText={setQrBindingLimit}
                keyboardType="number-pad"
              />
              <Text style={styles.inputUnit}>account(s)</Text>
            </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1e293b',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  inputUnit: {
    fontSize: 13,
    color: '#64748b',
  },
});

