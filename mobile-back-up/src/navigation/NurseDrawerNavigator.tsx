import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Nurse Screens
import NurseDashboard from '../screens/nurse/NurseDashboard';
import QrScanner from '../screens/nurse/QrScanner';
import AssignedPatients from '../screens/nurse/AssignedPatients';
import MedMonitoring from '../screens/nurse/MedMonitoring';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { logout } = useAuth();

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer} contentContainerStyle={styles.contentContainer}>
      {/* Brand Header */}
      <View style={styles.brandSection}>
        <Text style={styles.brandIcon}>+</Text>
        <Text style={styles.brandName}>PMed-Aid</Text>
      </View>

      {/* Drawer Menu Items */}
      <View style={styles.menuSection}>
        <DrawerItemList {...props} />
      </View>

      {/* Sign Out Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={logout}
        >
          <Text style={styles.logoutIcon}>⎋</Text>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function NurseDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2c3e50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
        drawerStyle: {
          backgroundColor: '#2c3e50',
        },
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#94a3b8',
        drawerActiveBackgroundColor: '#3b82f6',
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '600',
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginVertical: 2,
        },
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={NurseDashboard}
        options={{
          title: 'Nurse Dashboard',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>▦</Text>,
        }}
      />
      <Drawer.Screen 
        name="QrScanner" 
        component={QrScanner}
        options={{
          title: 'QR Scanner',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📷</Text>,
        }}
      />
      <Drawer.Screen 
        name="PatientMonitoring" 
        component={AssignedPatients}
        options={{
          title: 'Patient Monitoring',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text>,
        }}
      />
      <Drawer.Screen 
        name="MedicationSchedule" 
        component={MedMonitoring}
        options={{
          title: 'Medication Schedule Monitoring',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: '#2c3e50',
  },
  contentContainer: {
    flex: 1,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
    marginBottom: 10,
  },
  brandIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3b82f6',
    marginRight: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  menuSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: '#34495e',
    padding: 16,
    marginTop: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    gap: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutIcon: {
    fontSize: 20,
    color: '#ef4444',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
});
