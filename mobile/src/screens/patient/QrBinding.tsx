import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ScreenTemplate from '../../components/ScreenTemplate';
import api from '../../services/api';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  contact_number?: string;
}

export default function QrBinding() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Link prescription
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchQr();
  }, []);

  async function fetchQr() {
    try {
      setLoading(true);
      const meRes = await api.get('/patients/me');
      setPatient(meRes.data.data);
      const pId = meRes.data.data.id;

      const qrRes = await api.get(`/qr-codes/patient/${pId}`);
      const list = qrRes.data.data || [];
      const activeQr = list.find((q: any) => q.is_active);
      if (activeQr) setQrCode(activeQr.code);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleLinkPrescription() {
    if (!linkCode.trim()) {
      Alert.alert('Missing Code', 'Please enter a prescription linking code.');
      return;
    }
    setLinking(true);
    // Simulated — matches web's alert placeholder
    setTimeout(() => {
      setLinking(false);
      Alert.alert(
        'Link Prescription',
        `This simulates linking an external prescription with code "${linkCode}".`
      );
      setLinkCode('');
    }, 400);
  }

  function getInitials(p: Patient) {
    return `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();
  }

  return (
    <ScreenTemplate title="QR Binding">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.grid,
              isTablet && styles.gridTablet,
            ]}
          >
            {/* ── My QR Code Card ── */}
            <View style={[styles.card, isTablet && styles.cardHalf]}>
              <View style={styles.qrHeader}>
                <Text style={styles.qrIcon}>📷</Text>
                <Text style={styles.qrTitle}>My Patient QR</Text>
              </View>
              <Text style={styles.qrSubtitle}>
                Show this code to nurses during medication rounds.
              </Text>

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.loadingText}>Loading QR...</Text>
                </View>
              ) : qrCode ? (
                <View style={styles.qrBody}>
                  <View style={styles.qrFrame}>
                    <QRCode
                      value={qrCode}
                      size={200}
                      color="#0f172a"
                      backgroundColor="#ffffff"
                    />
                  </View>
                  <Text style={styles.qrCodeText} numberOfLines={2}>
                    Code: {qrCode}
                  </Text>
                </View>
              ) : (
                <View style={styles.noQrBox}>
                  <Text style={styles.noQrText}>
                    No active QR code linked.{'\n'}
                    Please visit the Info Desk.
                  </Text>
                </View>
              )}
            </View>

            {/* ── Linked Account Card ── */}
            <View style={[styles.card, isTablet && styles.cardHalf]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>👤</Text>
                <Text style={styles.sectionTitle}>Linked Account</Text>
              </View>

              {patient ? (
                <>
                  {/* Avatar + name */}
                  <View style={styles.patientRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {getInitials(patient)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.patientName} numberOfLines={1}>
                        {patient.first_name} {patient.last_name}
                      </Text>
                      <Text style={styles.patientStatus}>
                        Active Patient
                      </Text>
                    </View>
                  </View>

                  {/* Info box */}
                  <View style={styles.infoBox}>
                    <InfoRow
                      label="Date of Birth"
                      value={
                        patient.date_of_birth
                          ? new Date(
                              patient.date_of_birth
                            ).toLocaleDateString()
                          : '—'
                      }
                    />
                    <InfoRow
                      label="Gender"
                      value={patient.gender || '—'}
                      capitalize
                    />
                    <InfoRow
                      label="Contact"
                      value={
                        patient.phone || patient.contact_number || '—'
                      }
                    />
                  </View>
                </>
              ) : (
                <Text style={styles.loadingText}>Loading profile...</Text>
              )}

              {/* Link New Prescription */}
              <View style={styles.linkSection}>
                <Text style={styles.linkTitle}>
                  Link New Prescription
                </Text>
                <View style={styles.linkRow}>
                  <TextInput
                    style={styles.linkInput}
                    placeholder="Enter prescription linking code..."
                    placeholderTextColor="#94a3b8"
                    value={linkCode}
                    onChangeText={setLinkCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[
                      styles.linkBtn,
                      linking && styles.linkBtnDisabled,
                    ]}
                    onPress={handleLinkPrescription}
                    disabled={linking}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.linkBtnText}>
                      {linking ? '...' : '🔗 Link'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenTemplate>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: info row
// ─────────────────────────────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          capitalize && { textTransform: 'capitalize' },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16, paddingBottom: 40 },

  // Grid: stacked on phone, side-by-side on tablet
  grid: { gap: 16 },
  gridTablet: { flexDirection: 'row', alignItems: 'flex-start' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHalf: { flex: 1 },

  // QR card
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    gap: 8,
  },
  qrIcon: { fontSize: 20 },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  qrSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },

  qrBody: { alignItems: 'center' },
  qrFrame: {
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrCodeText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    textAlign: 'center',
  },

  // Loading
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },

  // No QR state
  noQrBox: {
    padding: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  noQrText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Linked Account section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },

  // Patient row
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientStatus: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },

  // Info box
  infoBox: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: { fontSize: 13, color: '#64748b' },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    flexShrink: 1,
    textAlign: 'right',
  },

  // Link section
  linkSection: { marginTop: 24 },
  linkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  linkBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  linkBtnDisabled: { opacity: 0.6 },
  linkBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});