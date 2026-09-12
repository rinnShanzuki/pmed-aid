import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Patient Screens
import PatientDashboard from '../screens/patient/PatientDashboard';
import MedicationSchedule from '../screens/patient/MedicationSchedule';
import MyPrescriptions from '../screens/patient/MyPrescriptions';
import AdherenceHistory from '../screens/patient/AdherenceHistory';
import QrBinding from '../screens/patient/QrBinding';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { user, logout } = useAuth();

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
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

export default function PatientDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#10b981',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
        drawerActiveTintColor: '#10b981',
        drawerInactiveTintColor: '#64748b',
        drawerActiveBackgroundColor: '#d1fae5',
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
        component={PatientDashboard}
        options={{
          title: 'Patient Dashboard',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>▦</Text>,
        }}
      />
      <Drawer.Screen 
        name="Schedule" 
        component={MedicationSchedule}
        options={{
          title: 'Medication Schedule',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text>,
        }}
      />
      <Drawer.Screen 
        name="Prescriptions" 
        component={MyPrescriptions}
        options={{
          title: 'Prescription List View',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      />
      <Drawer.Screen 
        name="History" 
        component={AdherenceHistory}
        options={{
          title: 'Adherence History',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📈</Text>,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: '#fff',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 10,
  },
  brandIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10b981',
    marginRight: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
    marginTop: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    gap: 12,
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 20,
    color: '#dc2626',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
});
