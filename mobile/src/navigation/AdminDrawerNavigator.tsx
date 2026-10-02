import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import UserManagement from '../screens/admin/UserManagement';
import PatientManagement from '../screens/admin/PatientManagement';
import PatientRecord from '../screens/admin/PatientRecord';
import MedicationManagement from '../screens/admin/MedicationManagement';
import ReportsAnalytics from '../screens/admin/ReportsAnalytics';
import SystemSettings from '../screens/admin/SystemSettings';

const Drawer = createDrawerNavigator();

// Custom Drawer Content
function CustomDrawerContent({ navigation }: any) {
  const { logout } = useAuth();
  const [activeRoute, setActiveRoute] = useState('AdminDashboard');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setActiveRoute(navigation.getState().routeNames[navigation.getState().index]);
    });
    return unsubscribe;
  }, [navigation]);

  const menuSections = [
    {
      label: 'MAIN',
      items: [
        { name: 'AdminDashboard', label: 'Dashboard', icon: 'view-dashboard' }
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { name: 'UserManagement', label: 'User Management', icon: 'account-multiple' },
        { name: 'PatientManagement', label: 'Patient Management', icon: 'hospital-box' }
      ]
    },
    {
      label: 'INSIGHTS',
      items: [
        { name: 'ReportsAnalytics', label: 'Reports & Analytics', icon: 'chart-bar' }
      ]
    },
    {
      label: 'CONFIGURATION',
      items: [
        { name: 'SystemSettings', label: 'System Settings', icon: 'cog' }
      ]
    }
  ];

  return (
    <View style={styles.drawerContainer}>
      {/* Header with Logo */}
      <View style={styles.drawerHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>⚡</Text>
          </View>
          <View>
            <Text style={styles.logoTitle}>PMed-Aid</Text>
            <Text style={styles.logoSubtitle}>Admin Portal</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuSections.map((section) => (
          <View key={section.label}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            {section.items.map((item) => {
              const isActive = activeRoute === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                  ]}
                  onPress={() => navigation.navigate(item.name)}
                >
                  <MaterialCommunityIcons 
                    name={item.icon as any} 
                    size={20} 
                    color={isActive ? '#3b82f6' : '#cbd5e1'} 
                  />
                  <Text
                    style={[
                      styles.menuText,
                      isActive && styles.menuTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={logout}>
        <MaterialCommunityIcons name="logout" size={20} color="#f87171" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1e293b', // Dark blue header
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerStyle: {
          backgroundColor: '#0f172a',
          width: 260,
        },
      }}
    >
      <Drawer.Screen 
        name="AdminDashboard" 
        component={AdminDashboard}
        options={{ title: 'Admin Dashboard' }}
      />
      <Drawer.Screen 
        name="UserManagement" 
        component={UserManagement}
        options={{ title: 'User Management' }}
      />
      <Drawer.Screen 
        name="PatientManagement" 
        component={PatientManagement}
        options={{ title: 'Patient Management' }}
      />
      <Drawer.Screen 
        name="PatientRecord" 
        component={PatientRecord}
        options={{ title: 'Patient Record', drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen 
        name="MedicationManagement" 
        component={MedicationManagement}
        options={{ title: 'Medication Management' }}
      />
      <Drawer.Screen 
        name="ReportsAnalytics" 
        component={ReportsAnalytics}
        options={{ title: 'Reports & Analytics' }}
      />
      <Drawer.Screen 
        name="SystemSettings" 
        component={SystemSettings}
        options={{ title: 'System Settings' }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark blue background
  },
  drawerHeader: {
    backgroundColor: '#1e293b',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2540',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoIconText: {
    fontSize: 24,
    color: '#fff',
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  logoSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    gap: 14,
    marginBottom: 4,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  menuItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  menuText: {
    fontSize: 15,
    color: '#cbd5e1',
    fontWeight: '400',
  },
  menuTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a2540',
  },
  signOutText: {
    fontSize: 15,
    color: '#f87171',
    fontWeight: '600',
  },
});
