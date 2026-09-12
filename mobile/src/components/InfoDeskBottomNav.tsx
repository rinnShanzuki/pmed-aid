import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  navigation: any;
  currentRoute: string;
}

export default function InfoDeskBottomNav({ navigation, currentRoute }: Props) {
  const navItems = [
    { route: 'InfoDeskDashboard', icon: '🏠', label: 'Home' },
    { route: 'PatientRegistration', icon: '📝', label: 'Register' },
    { route: 'AdmissionManagement', icon: '🏥', label: 'Admissions' },
    { route: 'PatientMonitoring', icon: '👁️', label: 'Monitor' },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = currentRoute === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
              {item.icon}
            </Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 4,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
});
