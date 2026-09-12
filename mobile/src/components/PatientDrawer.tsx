import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../hooks/useAuth';

interface PatientDrawerProps {
  navigation: any;
  currentRoute?: string;
}

export default function PatientDrawer({ navigation, currentRoute }: PatientDrawerProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { 
      key: 'PatientDashboard',
      label: 'Patient Dashboard', 
      icon: '📊',
      route: 'PatientDashboard' 
    },
    { 
      key: 'MedicationSchedule',
      label: 'Medication Schedule', 
      icon: '📅',
      route: 'MedicationSchedule' 
    },
    { 
      key: 'MyPrescriptions',
      label: 'Prescription List View', 
      icon: '📋',
      route: 'MyPrescriptions' 
    },
    { 
      key: 'AdherenceHistory',
      label: 'Adherence History', 
      icon: '📈',
      route: 'AdherenceHistory' 
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandPlus}>+</Text>
          </View>
          <Text style={styles.brandText}>PMed-Aid</Text>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          const isActive = currentRoute === item.route;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.route)}
            >
              <Text style={[styles.menuIcon, isActive && styles.menuIconActive]}>
                {item.icon}
              </Text>
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer - Logout */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#10b981',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandPlus: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuContainer: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#10b981',
  },
  menuIcon: {
    fontSize: 20,
  },
  menuIconActive: {
    fontSize: 20,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
  },
  menuLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
  },
});
