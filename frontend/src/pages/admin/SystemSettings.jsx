import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, Shield, QrCode, Settings as SettingsIcon } from 'lucide-react';

const DEFAULT_SETTINGS = {
  // Notification Settings
  email_notifications: 'true',
  sms_notifications: 'false',
  push_notifications: 'true',
  reminder_before_minutes: '30',
  // Security Settings
  require_2fa: 'false',
  session_timeout_minutes: '60',
  password_min_length: '8',
  max_login_attempts: '5',
  // QR Settings
  qr_expiry_days: '30',
  qr_auto_generate: 'true',
  qr_binding_limit: '1',
};

export default function SystemSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await api.get('/admin/settings');
        if (data.data?.length > 0) {
          const mapped = {};
          data.data.forEach(s => { mapped[s.key] = s.value; });
          setSettings(prev => ({ ...prev, ...mapped }));
        }
      } catch (err) {
        console.error('Settings fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value }));
      await api.put('/admin/settings', { settings: settingsArray });
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="empty-state"><SettingsIcon size={48} /><p>Loading settings...</p></div>;
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
          <SettingsIcon size={20} style={{ display: 'inline', marginRight: 10, verticalAlign: 'text-bottom' }} />
          System Settings
        </h2>
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {success && <div className="admin-alert admin-alert-success">{success}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="settings-grid">

        {/* ── Notification Settings ── */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Bell />
            <h3>Notification Settings</h3>
          </div>
          <div className="settings-section-body">
            <ToggleRow
              title="Email Notifications"
              desc="Send medication reminders and alerts via email"
              checked={settings.email_notifications === 'true'}
              onChange={(v) => updateSetting('email_notifications', v ? 'true' : 'false')}
            />
            <ToggleRow
              title="SMS Notifications"
              desc="Send text message reminders to patients"
              checked={settings.sms_notifications === 'true'}
              onChange={(v) => updateSetting('sms_notifications', v ? 'true' : 'false')}
            />
            <ToggleRow
              title="Push Notifications"
              desc="Enable browser push notifications"
              checked={settings.push_notifications === 'true'}
              onChange={(v) => updateSetting('push_notifications', v ? 'true' : 'false')}
            />
            <InputRow
              title="Reminder Lead Time"
              desc="Minutes before scheduled time to send reminder"
              value={settings.reminder_before_minutes}
              onChange={(v) => updateSetting('reminder_before_minutes', v)}
              suffix="minutes"
            />
          </div>
        </div>

        {/* ── Security Settings ── */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Shield />
            <h3>Security Settings</h3>
          </div>
          <div className="settings-section-body">
            <ToggleRow
              title="Two-Factor Authentication"
              desc="Require 2FA for all admin accounts"
              checked={settings.require_2fa === 'true'}
              onChange={(v) => updateSetting('require_2fa', v ? 'true' : 'false')}
            />
            <InputRow
              title="Session Timeout"
              desc="Auto-logout after inactivity"
              value={settings.session_timeout_minutes}
              onChange={(v) => updateSetting('session_timeout_minutes', v)}
              suffix="minutes"
            />
            <InputRow
              title="Minimum Password Length"
              desc="Enforce minimum password characters"
              value={settings.password_min_length}
              onChange={(v) => updateSetting('password_min_length', v)}
              suffix="chars"
            />
            <InputRow
              title="Max Login Attempts"
              desc="Lock account after failed attempts"
              value={settings.max_login_attempts}
              onChange={(v) => updateSetting('max_login_attempts', v)}
              suffix="attempts"
            />
          </div>
        </div>

        {/* ── QR Settings ── */}
        <div className="settings-section">
          <div className="settings-section-header">
            <QrCode />
            <h3>QR Code Settings</h3>
          </div>
          <div className="settings-section-body">
            <InputRow
              title="QR Code Expiry"
              desc="Days before a discharge QR code expires"
              value={settings.qr_expiry_days}
              onChange={(v) => updateSetting('qr_expiry_days', v)}
              suffix="days"
            />
            <ToggleRow
              title="Auto-Generate QR on Discharge"
              desc="Automatically create QR codes when patients are discharged"
              checked={settings.qr_auto_generate === 'true'}
              onChange={(v) => updateSetting('qr_auto_generate', v ? 'true' : 'false')}
            />
            <InputRow
              title="QR Binding Limit"
              desc="Maximum number of accounts a single QR code can bind"
              value={settings.qr_binding_limit}
              onChange={(v) => updateSetting('qr_binding_limit', v)}
              suffix="account(s)"
            />
          </div>
        </div>

      </div>
    </>
  );
}

/* ── Helper Components ── */
function ToggleRow({ title, desc, checked, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-row-info">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
      <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}

function InputRow({ title, desc, value, onChange, suffix }) {
  return (
    <div className="setting-row">
      <div className="setting-row-info">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          min="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 70, padding: '6px 10px', border: '1px solid #e2e8f0',
            borderRadius: 6, fontSize: '0.85rem', fontFamily: 'inherit',
            textAlign: 'center', outline: 'none', color: '#1e293b',
          }}
        />
        {suffix && <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{suffix}</span>}
      </div>
    </div>
  );
}
