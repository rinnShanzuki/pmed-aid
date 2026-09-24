import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Info Desk Screens
import InfoDeskDashboard from '../screens/info-desk/InfoDeskDashboard';
import AdmissionManagement from '../screens/info-desk/AdmissionManagement';
import PatientMonitoring from '../screens/info-desk/PatientMonitoring';
import PatientRecords from '../screens/info-desk/PatientRecords';
import PrescriptionManagement from '../screens/info-desk/PrescriptionManagement';
import BillingExpenses from '../screens/info-desk/BillingExpenses';

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

export default function InfoDeskDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1e3a5f',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
        drawerStyle: {
          backgroundColor: '#1e3a5f',
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
        component={InfoDeskDashboard}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>▦</Text>,
        }}
      />
      <Drawer.Screen 
        name="AdmissionManagement" 
        component={AdmissionManagement}
        options={{
          title: 'Admission Management',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🛏️</Text>,
        }}
      />
      <Drawer.Screen 
        name="PatientMonitoring" 
        component={PatientMonitoring}
        options={{
          title: 'Patient Monitoring',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />
      <Drawer.Screen 
        name="PatientRecords" 
        component={PatientRecords}
        options={{
          title: 'Patient Records',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text>,
        }}
      />
      <Drawer.Screen 
        name="PrescriptionManagement" 
        component={PrescriptionManagement}
        options={{
          title: 'Prescription Management',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
        }}
      />
      <Drawer.Screen 
        name="BillingManagement" 
        component={BillingExpenses}
        options={{
          title: 'Billing Management',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💰</Text>,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: '#1e3a5f',
  },
  contentContainer: {
    flex: 1,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d4a6f',
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
    borderTopColor: '#2d4a6f',
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
