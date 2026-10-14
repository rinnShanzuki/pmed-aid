import React from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useOrientation } from '../hooks/useOrientation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Pharmacy Screens
import PharmacyDashboard from '../screens/pharmacy/PharmacyDashboard';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { logout } = useAuth();

  return (
    <DrawerContentScrollView
      {...props}
      style={styles.drawerContainer}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={true}
    >
      {/* Brand Header */}
      <View style={styles.brandSection}>
        <Text style={styles.brandIcon}>+</Text>
        <Text style={styles.brandName}>PMed-Aid Pharmacy</Text>
      </View>

      {/* Drawer Menu Items - Scrollable */}
      <ScrollView style={styles.menuSection} scrollEnabled={true}>
        <DrawerItemList {...props} />
      </ScrollView>

      {/* Sign Out Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function PharmacyDrawerNavigator() {
  const { width, height, isLandscape } = useOrientation();
  
  // Responsive drawer width
  const drawerWidth = isLandscape ? Math.min(280, width * 0.35) : 260;
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1e293b',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
        drawerStyle: {
          backgroundColor: '#1e293b',
          width: drawerWidth,
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
        component={PharmacyDashboard}
        options={{
          title: 'Inventory & Dispensing',
          headerTitle: 'Pharmacy',
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="pill" size={20} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: '#1e293b',
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 10,
  },
  brandIcon: {
    fontSize: 26,
    fontWeight: '700',
    color: '#3b82f6',
    marginRight: 8,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  menuSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    padding: 16,
    marginTop: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
});
