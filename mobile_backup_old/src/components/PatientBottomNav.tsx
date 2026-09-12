import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface PatientBottomNavProps {
  navigation: any;
  currentRoute: string;
}

export default function PatientBottomNav({ navigation, currentRoute }: PatientBottomNavProps) {
  const navItems = [
    { 
      key: 'PatientDashboard',
      label: 'Dashboard', 
      icon: '📊',
      route: 'PatientDashboard' 
    },
    { 
      key: 'MedicationSchedule',
      label: 'Schedule', 
      icon: '📅',
      route: 'MedicationSchedule' 
    },
    { 
      key: 'MyPrescriptions',
      label: 'Prescriptions', 
      icon: '📋',
      route: 'MyPrescriptions' 
    },
    { 
      key: 'AdherenceHistory',
      label: 'History', 
      icon: '📈',
      route: 'AdherenceHistory' 
    },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = currentRoute === item.route;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: '#10b981',
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  labelActive: {
    color: '#10b981',
    fontWeight: '600',
  },
});
