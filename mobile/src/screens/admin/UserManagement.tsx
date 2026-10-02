import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import api from '../../services/api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  createdAt?: string;
  created_at?: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
}

const INITIAL_FORM: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'doctor',
  is_active: true,
};

// Matches web's ROLE_COLORS (avatar bg)
const ROLE_COLORS: { [key: string]: string } = {
  admin: '#7c3aed',
  doctor: '#16a34a',
  nurse: '#ea580c',
  info_desk: '#0284c7',
  pharmacy: '#b45309',
};

// Badge bg / text colors matching web's `badge-${role}` CSS
const ROLE_BADGE_BG: { [key: string]: string } = {
  admin: '#ede9fe',
  doctor: '#dcfce7',
  nurse: '#ffedd5',
  info_desk: '#dbeafe',
  pharmacy: '#fef3c7',
};
const ROLE_BADGE_TEXT: { [key: string]: string } = {
  admin: '#6d28d9',
  doctor: '#15803d',
  nurse: '#c2410c',
  info_desk: '#0369a1',
  pharmacy: '#b45309',
};

const ROLE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'info_desk', label: 'Info Desk' },
  { value: 'pharmacy', label: 'Pharmacy' },
];

export default function UserManagement() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<null | 'add' | 'edit'>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Dropdowns inside modal
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Fixed column widths for horizontal scroll
  const TABLE_WIDTH = 800;
  const COL_USER = 260;
  const COL_ROLE = 130;
  const COL_STATUS = 110;
  const COL_JOINED = 130;
  const COL_ACTIONS = 110;

  useEffect(() => {
    fetchUsers();
  }, [search, showInactive, activeTab]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const params: any = { search };
      if (!showInactive) params.is_active = 'true';
      if (activeTab !== 'all') params.role = activeTab;
      const { data } = await api.get('/users', { params });
      const staffOnly = (data.data || []).filter(
        (u: User) => u.role !== 'patient'
      );
      setUsers(staffOnly);
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm(INITIAL_FORM);
    setEditId(null);
    setError('');
    setShowRoleDropdown(false);
    setShowStatusDropdown(false);
    setModal('add');
  }

  function openEdit(user: User) {
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active,
    });
    setEditId(user.id);
    setError('');
    setShowRoleDropdown(false);
    setShowStatusDropdown(false);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setError('');
    setShowRoleDropdown(false);
    setShowStatusDropdown(false);
  }

  async function handleSubmit() {
    setError('');
    if (!form.first_name || !form.last_name || !form.email) {
      setError('Please fill in all required fields.');
      return;
    }
    if (modal === 'add' && !form.password) {
      setError('Password is required for new users.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = { ...form };
      if (modal === 'edit' && !payload.password) delete payload.password;

      if (modal === 'add') {
        await api.post('/users', payload);
      } else {
        await api.put(`/users/${editId}`, payload);
      }
      closeModal();
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: number) {
    Alert.alert(
      'Deactivate User',
      'Are you sure you want to deactivate this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users/${id}`);
              fetchUsers();
            } catch (err: any) {
              Alert.alert(
                'Error',
                err.response?.data?.message || 'Failed to deactivate user.'
              );
            }
          },
        },
      ]
    );
  }

  // ── Helpers ──
  function getInitials(u: User) {
    return `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase();
  }

  function getRoleLabel(role: string) {
    if (role === 'info_desk') return 'Info Desk';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  // Filter logic matches web (server already filters, but we also client-filter for safety)
  const filtered = users.filter((u) => {
    const nameMatch = search
      ? `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      : true;
    const statusMatch = showInactive ? true : u.is_active;
    const roleMatch = activeTab === 'all' || u.role === activeTab;
    return nameMatch && statusMatch && roleMatch;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>👥 User Management</Text>

        {/* Role tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {ROLE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.value && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search + Add */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setShowInactive(!showInactive)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.checkbox, showInactive && styles.checkboxChecked]}
            >
              {showInactive && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Show Inactive</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ Add User</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.tableScrollWrapper}
        >
          <View style={{ width: TABLE_WIDTH }}>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: COL_USER }]}>User</Text>
              <Text style={[styles.th, { width: COL_ROLE }]}>Role</Text>
              <Text style={[styles.th, { width: COL_STATUS }]}>Status</Text>
              <Text style={[styles.th, { width: COL_JOINED }]}>Joined</Text>
              <Text style={[styles.th, { width: COL_ACTIONS }]}>Actions</Text>
            </View>

            {/* Table rows */}
            <ScrollView
              style={styles.tableBody}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              {filtered.length === 0 ? (
                <Text style={styles.emptyText}>No users found</Text>
              ) : (
                filtered.map((u, idx) => (
                  <View
                    key={u.id}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 && styles.tableRowEven,
                    ]}
                  >
                    {/* User cell */}
                    <View
                      style={[styles.userCell, { width: COL_USER }]}
                    >
                      <View
                        style={[
                          styles.avatar,
                          {
                            backgroundColor:
                              ROLE_COLORS[u.role] || '#3b82f6',
                          },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {getInitials(u)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={styles.userName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {u.first_name} {u.last_name}
                        </Text>
                        <Text
                          style={styles.userEmail}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {u.email}
                        </Text>
                      </View>
                    </View>

                    {/* Role */}
                    <View style={{ width: COL_ROLE }}>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor:
                              ROLE_BADGE_BG[u.role] || '#f3f4f6',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            {
                              color:
                                ROLE_BADGE_TEXT[u.role] || '#6b7280',
                            },
                          ]}
                        >
                          {getRoleLabel(u.role)}
                        </Text>
                      </View>
                    </View>

                    {/* Status */}
                    <View style={{ width: COL_STATUS }}>
                      <View
                        style={[
                          styles.badge,
                          u.is_active
                            ? styles.statusActive
                            : styles.statusInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            u.is_active
                              ? styles.statusActiveText
                              : styles.statusInactiveText,
                          ]}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    {/* Joined */}
                    <Text
                      style={[styles.td, styles.tdMuted, { width: COL_JOINED }]}
                    >
                      {new Date(
                        u.createdAt || u.created_at || ''
                      ).toLocaleDateString()}
                    </Text>

                    {/* Actions */}
                    <View
                      style={[styles.actionsCell, { width: COL_ACTIONS }]}
                    >
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openEdit(u)}
                      >
                        <Text style={styles.actionIcon}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDanger]}
                        onPress={() => handleDelete(u.id)}
                      >
                        <Text style={styles.actionIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {!isTablet && !loading && filtered.length > 0 ? (
        <Text style={styles.scrollHint}>← Swipe to see more →</Text>
      ) : null}

      {/* ── Add / Edit Modal ── */}
      <Modal
        visible={modal !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBox}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modal === 'add' ? 'Add New User' : 'Edit User'}
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={10}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={form.first_name}
                onChangeText={(v) => setForm({ ...form, first_name: v })}
                placeholder="Enter first name"
                placeholderTextColor="#cbd5e1"
              />

              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={form.last_name}
                onChangeText={(v) => setForm({ ...form, last_name: v })}
                placeholder="Enter last name"
                placeholderTextColor="#cbd5e1"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#cbd5e1"
              />

              <Text style={styles.label}>
                {modal === 'edit'
                  ? 'New Password (leave blank to keep)'
                  : 'Password *'}
              </Text>
              <TextInput
                style={styles.input}
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                placeholder="Enter password"
                secureTextEntry
                placeholderTextColor="#cbd5e1"
              />

              {/* Role dropdown */}
              <Text style={styles.label}>Role</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => {
                  setShowRoleDropdown(!showRoleDropdown);
                  setShowStatusDropdown(false);
                }}
              >
                <Text style={styles.selectBtnText}>
                  {getRoleLabel(form.role)}
                </Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
              {showRoleDropdown ? (
                <View style={styles.dropdown}>
                  {['admin', 'doctor', 'nurse', 'info_desk', 'pharmacy'].map(
                    (role) => (
                      <TouchableOpacity
                        key={role}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setForm({ ...form, role });
                          setShowRoleDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            form.role === role &&
                              styles.dropdownItemTextActive,
                          ]}
                        >
                          {getRoleLabel(role)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              ) : null}

              {/* Status dropdown */}
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowRoleDropdown(false);
                }}
              >
                <Text style={styles.selectBtnText}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
              {showStatusDropdown ? (
                <View style={styles.dropdown}>
                  {[
                    { label: 'Active', value: true },
                    { label: 'Inactive', value: false },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.label}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setForm({ ...form, is_active: opt.value });
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          form.is_active === opt.value &&
                            styles.dropdownItemTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerBtn, styles.cancelBtn]}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerBtn, styles.saveBtn]}
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving
                    ? 'Saving...'
                    : modal === 'add'
                    ? 'Create User'
                    : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  },

  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },

  // Tabs
  tabsRow: {
    gap: 8,
    paddingBottom: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  tabActive: { backgroundColor: '#eff6ff' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  tabTextActive: { color: '#3b82f6', fontWeight: '700' },

  // Search
  searchRow: { marginBottom: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },

  // Action row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  checkboxLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },

  addBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Table
  tableScrollWrapper: { flex: 1, padding: 16 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableBody: { maxHeight: 600 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  tableRowEven: { backgroundColor: '#fafbfc' },

  userCell: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  userName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  userEmail: { fontSize: 12, color: '#64748b', marginTop: 2 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  statusActive: { backgroundColor: '#dcfce7' },
  statusInactive: { backgroundColor: '#fee2e2' },
  statusActiveText: { color: '#10b981' },
  statusInactiveText: { color: '#ef4444' },

  td: { fontSize: 13, color: '#1e293b' },
  tdMuted: { fontSize: 12, color: '#64748b' },

  actionsCell: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnDanger: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  actionIcon: { fontSize: 15 },

  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  scrollHint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  modalClose: { fontSize: 22, color: '#94a3b8', fontWeight: '400' },
  modalBody: { padding: 16, maxHeight: 480 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#fff',
  },

  selectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectBtnText: { fontSize: 14, color: '#1e293b' },
  selectArrow: { fontSize: 12, color: '#94a3b8' },

  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    marginTop: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: { fontSize: 14, color: '#64748b' },
  dropdownItemTextActive: { color: '#3b82f6', fontWeight: '700' },

  errorBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  errorText: { color: '#991b1b', fontSize: 13, fontWeight: '600' },

  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: '#f1f5f9' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  saveBtn: { backgroundColor: '#3b82f6' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});