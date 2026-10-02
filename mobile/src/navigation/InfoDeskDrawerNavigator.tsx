import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Info Desk Screens
import InfoDeskDashboard from '../screens/info-desk/InfoDeskDashboard';
import AdmissionManagement from '../screens/info-desk/AdmissionManagement';
import PatientMonitoring from '../screens/info-desk/PatientMonitoring';
import PatientRecords from '../screens/info-desk/PatientRecords';
import PatientDetail from '../screens/info-desk/PatientDetail';
import PrescriptionManagement from '../screens/info-desk/PrescriptionManagement';
import PrescriptionDetail from '../screens/info-desk/PrescriptionDetail';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { logout, user } = useAuth();

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer} contentContainerStyle={styles.contentContainer}>
      {/* Brand Header */}
      <View style={styles.brandSection}>
        <View style={styles.brandIcon}>
          <Text style={styles.brandIconText}>A</Text>
        </View>
        <View>
          <Text style={styles.brandName}>PMed-Aid</Text>
          <Text style={styles.brandRole}>Information Desk</Text>
        </View>
      </View>

      {/* Drawer Menu Items */}
      <View style={styles.menuSection}>
        <DrawerItemList {...props} />
      </View>

      {/* User Profile Card */}
      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.profileRole}>{user?.role?.replace('_', ' ')}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={logout}
        >
          <MaterialCommunityIcons name="logout" size={18} color="#ef4444" />
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
          backgroundColor: '#0f1117',
          width: '70%',
        },
        drawerActiveTintColor: '#3b82f6',
        drawerInactiveTintColor: '#cbd5e1',
        drawerActiveBackgroundColor: 'rgba(59, 130, 246, 0.15)',
        drawerLabelStyle: {
          fontSize: 13,
          fontWeight: '500',
          marginLeft: -12,
        },
        drawerItemStyle: {
          borderRadius: 6,
          marginVertical: 8,
          marginHorizontal: 12,
          paddingVertical: 12,
        },
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={InfoDeskDashboard}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="AdmissionManagement" 
        component={AdmissionManagement}
        options={{
          title: 'Admission Management',
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="hospital-box" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="PrescriptionManagement" 
        component={PrescriptionManagement}
        options={{
          title: 'Prescription Management',
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-list" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="PrescriptionDetail" 
        component={PrescriptionDetail}
        options={{
          title: 'Prescription Detail',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen 
        name="PatientRecords" 
        component={PatientRecords}
        options={{
          title: 'Patient Records',
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="file-document" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="PatientDetail" 
        component={PatientDetail}
        options={{
          title: 'Patient Detail',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen 
        name="PatientMonitoring" 
        component={PatientMonitoring}
        options={{
          title: 'Patient Monitoring',
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: '#0f1117',
  },
  contentContainer: {
    flex: 1,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 24,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  brandIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  brandRole: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  menuSection: {
    flex: 1,
    paddingHorizontal: 4,
  },
  profileSection: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    padding: 12,
    marginTop: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  profileRole: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  logoutButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
