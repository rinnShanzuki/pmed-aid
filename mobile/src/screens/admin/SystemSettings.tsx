import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import api from '../../services/api';

const DEFAULT_SETTINGS = {
  email_notifications: 'true',
  sms_notifications: 'false',
  push_notifications: 'true',
  reminder_before_minutes: '30',
  require_2fa: 'false',
  session_timeout_minutes: '60',
  password_min_length: '8',
  max_login_attempts: '5',
  qr_expiry_days: '30',
  qr_auto_generate: 'true',
  qr_binding_limit: '1',
};

export default function SystemSettings() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const [settings, setSettings] = useState<{ [key: string]: string }>(
    DEFAULT_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/settings');
      if (data.data?.length > 0) {
        const mapped: { [key: string]: string } = {};
        data.data.forEach((s: any) => {
          mapped[s.key] = s.value;
        });
        setSettings((prev) => ({ ...prev, ...mapped }));
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
      setError('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSuccess('');
    setError('');
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));
      await api.put('/admin/settings', { settings: settingsArray });
      setSuccess('Settings saved successfully!');
      setHasChanges(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky Header with Save */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ System Settings</Text>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (saving || !hasChanges) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || !hasChanges}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving...' : 'Save All'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Banners */}
          {success ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>✓ {success}</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          <View style={[styles.settingsGrid, isTablet && styles.settingsGridTablet]}>
            {/* ── Notification Settings ── */}
            <View style={[styles.sectionCard, isTablet && styles.sectionCardTablet]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🔔</Text>
                <Text style={styles.sectionTitle}>Notification Settings</Text>
              </View>

              <ToggleRow
                title="Email Notifications"
                desc="Send medication reminders and alerts via email"
                checked={settings.email_notifications === 'true'}
                onChange={(v) =>
                  updateSetting('email_notifications', v ? 'true' : 'false')
                }
                isSmallPhone={isSmallPhone}
              />
              <ToggleRow
                title="SMS Notifications"
                desc="Send text message reminders to patients"
                checked={settings.sms_notifications === 'true'}
                onChange={(v) =>
                  updateSetting('sms_notifications', v ? 'true' : 'false')
                }
                isSmallPhone={isSmallPhone}
              />
              <ToggleRow
                title="Push Notifications"
                desc="Enable browser push notifications"
                checked={settings.push_notifications === 'true'}
                onChange={(v) =>
                  updateSetting('push_notifications', v ? 'true' : 'false')
                }
                isSmallPhone={isSmallPhone}
              />
              <InputRow
                title="Reminder Lead Time"
                desc="Minutes before scheduled time to send reminder"
                value={settings.reminder_before_minutes}
                onChange={(v) => updateSetting('reminder_before_minutes', v)}
                suffix="minutes"
                isSmallPhone={isSmallPhone}
              />
            </View>

            {/* ── Security Settings ── */}
            <View style={[styles.sectionCard, isTablet && styles.sectionCardTablet]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🛡️</Text>
                <Text style={styles.sectionTitle}>Security Settings</Text>
              </View>

              <ToggleRow
                title="Two-Factor Authentication"
                desc="Require 2FA for all admin accounts"
                checked={settings.require_2fa === 'true'}
                onChange={(v) =>
                  updateSetting('require_2fa', v ? 'true' : 'false')
                }
                isSmallPhone={isSmallPhone}
              />
              <InputRow
                title="Session Timeout"
                desc="Auto-logout after inactivity"
                value={settings.session_timeout_minutes}
                onChange={(v) => updateSetting('session_timeout_minutes', v)}
                suffix="minutes"
                isSmallPhone={isSmallPhone}
              />
              <InputRow
                title="Minimum Password Length"
                desc="Enforce minimum password characters"
                value={settings.password_min_length}
                onChange={(v) => updateSetting('password_min_length', v)}
                suffix="chars"
                isSmallPhone={isSmallPhone}
              />
              <InputRow
                title="Max Login Attempts"
                desc="Lock account after failed attempts"
                value={settings.max_login_attempts}
                onChange={(v) => updateSetting('max_login_attempts', v)}
                suffix="attempts"
                isSmallPhone={isSmallPhone}
              />
            </View>

            {/* ── QR Code Settings ── */}
            <View style={[styles.sectionCard, isTablet && styles.sectionCardTablet]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📱</Text>
                <Text style={styles.sectionTitle}>QR Code Settings</Text>
              </View>

              <InputRow
                title="QR Code Expiry"
                desc="Days before a discharge QR code expires"
                value={settings.qr_expiry_days}
                onChange={(v) => updateSetting('qr_expiry_days', v)}
                suffix="days"
                isSmallPhone={isSmallPhone}
              />
              <ToggleRow
                title="Auto-Generate QR on Discharge"
                desc="Automatically create QR codes when patients are discharged"
                checked={settings.qr_auto_generate === 'true'}
                onChange={(v) =>
                  updateSetting('qr_auto_generate', v ? 'true' : 'false')
                }
                isSmallPhone={isSmallPhone}
              />
              <InputRow
                title="QR Binding Limit"
                desc="Maximum number of accounts a single QR code can bind"
                value={settings.qr_binding_limit}
                onChange={(v) => updateSetting('qr_binding_limit', v)}
                suffix="account(s)"
                isSmallPhone={isSmallPhone}
              />
            </View>
          </View>

          {/* Footer save hint (mobile) */}
          <TouchableOpacity
            style={[
              styles.saveBtnLarge,
              (saving || !hasChanges) && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={saving || !hasChanges}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : 'Save All Settings'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────────

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
  isSmallPhone,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  isSmallPhone?: boolean;
}) {
  return (
    <View style={[styles.settingRow, isSmallPhone && styles.settingRowSmall]}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{title}</Text>
        <Text style={styles.settingDesc}>{desc}</Text>
      </View>
      <Switch
        value={checked}
        onValueChange={onChange}
        trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
        thumbColor={checked ? '#3b82f6' : '#f4f4f5'}
        ios_backgroundColor="#cbd5e1"
      />
    </View>
  );
}

function InputRow({
  title,
  desc,
  value,
  onChange,
  suffix,
  isSmallPhone,
}: {
  title: string;
  desc: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  isSmallPhone?: boolean;
}) {
  return (
    <View style={[styles.settingRow, isSmallPhone && styles.settingRowSmall]}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{title}</Text>
        <Text style={styles.settingDesc}>{desc}</Text>
      </View>
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.numberInput}
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          maxLength={5}
          selectTextOnFocus
        />
        {suffix ? <Text style={styles.inputUnit}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', flex: 1 },

  saveBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnLarge: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { backgroundColor: '#cbd5e1' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  scrollContainer: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 60 },

  // Banners
  successBanner: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: { color: '#166534', fontWeight: '600', fontSize: 13 },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#991b1b', fontWeight: '600', fontSize: 13 },

  // Grid
  settingsGrid: { gap: 16 },
  settingsGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },

  // Section cards
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionCardTablet: { width: '48%' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionIcon: { fontSize: 18, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },

  // Setting rows
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 12,
  },
  settingRowSmall: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  settingInfo: { flex: 1 },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },

  // Input
  inputGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numberInput: {
    width: 70,
    height: 38,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1e293b',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  inputUnit: { fontSize: 13, color: '#64748b', fontWeight: '500' },
});