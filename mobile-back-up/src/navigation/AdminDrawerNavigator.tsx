import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import UserManagement from '../screens/admin/UserManagement';
import PatientManagement from '../screens/admin/PatientManagement';
import MedicationManagement from '../screens/admin/MedicationManagement';
import ReportsAnalytics from '../screens/admin/ReportsAnalytics';
import SystemSettings from '../screens/admin/SystemSettings';

const Drawer = createDrawerNavigator();

// Custom Drawer Content
function CustomDrawerContent({ navigation }: any) {
  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.drawerContainer}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>⚡</Text>
          </View>
          <View>
            <Text style={styles.logoTitle}>PMed-Aid</Text>
            <Text style={styles.logoSubtitle}>Admin Panel</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {/* MAIN Section */}
        <Text style={styles.sectionLabel}>MAIN</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>Dashboard</Text>
        </TouchableOpacity>

        {/* MANAGEMENT Section */}
        <Text style={styles.sectionLabel}>MANAGEMENT</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('PatientManagement')}
        >
          <Text style={styles.menuIcon}>🏥</Text>
          <Text style={styles.menuText}>Patients</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MedicationManagement')}
        >
          <Text style={styles.menuIcon}>💊</Text>
          <Text style={styles.menuText}>Medications</Text>
        </TouchableOpacity>

        {/* INSIGHTS Section */}
        <Text style={styles.sectionLabel}>INSIGHTS</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ReportsAnalytics')}
        >
          <Text style={styles.menuIcon}>📈</Text>
          <Text style={styles.menuText}>Reports</Text>
        </TouchableOpacity>

        {/* CONFIGURATION Section */}
        <Text style={styles.sectionLabel}>CONFIGURATION</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('SystemSettings')}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('UserManagement')}
        >
          <Text style={styles.menuIcon}>👥</Text>
          <Text style={styles.menuText}>Users</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutIcon}>🚪</Text>
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
          width: 280,
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
    paddingTop: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 28,
  },
  menuText: {
    fontSize: 15,
    color: '#cbd5e1',
    fontWeight: '400',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 8,
  },
  signOutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  signOutText: {
    fontSize: 15,
    color: '#f87171',
    fontWeight: '600',
  },
});
