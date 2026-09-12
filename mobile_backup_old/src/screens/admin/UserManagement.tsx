import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import api from '../../services/api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (err: any) {
      console.error('Fetch users error:', err);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (userId: number) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${userId}`);
              fetchUsers();
              Alert.alert('Success', 'User deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'patient': return '#fce7f3';
      case 'doctor': return '#dcfce7';
      case 'nurse': return '#fed7aa';
      case 'admin': return '#e0e7ff';
      case 'info_desk': return '#dbeafe';
      default: return '#f3f4f6';
    }
  };

  const getRoleTextColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'patient': return '#ec4899';
      case 'doctor': return '#10b981';
      case 'nurse': return '#f97316';
      case 'admin': return '#6366f1';
      case 'info_desk': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'info_desk') return 'Info Desk';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'patient': return '#ec4899';
      case 'doctor': return '#10b981';
      case 'nurse': return '#f97316';
      case 'admin': return '#6366f1';
      case 'info_desk': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = showInactive ? !user.is_active : user.is_active;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerIcon}>👥</Text>
          <Text style={styles.headerTitle}>User Management</Text>
        </View>
        
        <View style={styles.controls}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
          
          <View style={styles.rightControls}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setShowInactive(!showInactive)}
            >
              <View style={[styles.checkbox, showInactive && styles.checkboxChecked]}>
                {showInactive && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Show Inactive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonIcon}>+</Text>
              <Text style={styles.addButtonText}>Add User</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colUser]}>USER</Text>
            <Text style={[styles.tableHeaderText, styles.colRole]}>ROLE</Text>
            <Text style={[styles.tableHeaderText, styles.colStatus]}>STATUS</Text>
            <Text style={[styles.tableHeaderText, styles.colJoined]}>JOINED</Text>
            <Text style={[styles.tableHeaderText, styles.colActions]}>ACTIONS</Text>
          </View>

          {/* Table Rows */}
          <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.colUser]}>
                  <View style={[styles.avatar, { backgroundColor: getAvatarColor(user.role) }]}>
                    <Text style={styles.avatarText}>
                      {getInitials(user.first_name, user.last_name)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>{user.first_name} {user.last_name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                </View>

                <View style={[styles.tableCell, styles.colRole]}>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                    <Text style={[styles.roleText, { color: getRoleTextColor(user.role) }]}>
                      {getRoleLabel(user.role)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.tableCell, styles.colStatus]}>
                  <View style={[styles.statusBadge, { backgroundColor: user.is_active ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.statusText, { color: user.is_active ? '#10b981' : '#ef4444' }]}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.tableCell, styles.colJoined]}>
                  <Text style={styles.dateText}>{formatDate(user.createdAt)}</Text>
                </View>

                <View style={[styles.tableCell, styles.colActions]}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDelete(user.id)}
                  >
                    <Text style={styles.actionIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {filteredUsers.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  controls: {
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  rightControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  addButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  tableContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableBody: {
    maxHeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
  },
  colUser: {
    width: 250,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colRole: {
    width: 120,
  },
  colStatus: {
    width: 100,
  },
  colJoined: {
    width: 120,
  },
  colActions: {
    width: 100,
    flexDirection: 'row',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  actionIcon: {
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
