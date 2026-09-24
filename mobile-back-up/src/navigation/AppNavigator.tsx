import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Auth Screens
import AuthScreen from '../screens/AuthScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Admin Drawer Navigator
import AdminDrawerNavigator from './AdminDrawerNavigator';

// Info Desk Drawer Navigator
import InfoDeskDrawerNavigator from './InfoDeskDrawerNavigator';

// Doctor Drawer Navigator
import DoctorDrawerNavigator from './DoctorDrawerNavigator';

// Nurse Drawer Navigator
import NurseDrawerNavigator from './NurseDrawerNavigator';

// Patient Drawer Navigator
import PatientDrawerNavigator from './PatientDrawerNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#1d64c1' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {user.role === 'admin' && (
              <Stack.Screen name="AdminMain" component={AdminDrawerNavigator} />
            )}
            {user.role === 'info_desk' && (
              <Stack.Screen name="InfoDeskMain" component={InfoDeskDrawerNavigator} />
            )}
            {user.role === 'doctor' && (
              <Stack.Screen name="DoctorMain" component={DoctorDrawerNavigator} />
            )}
            {user.role === 'nurse' && (
              <Stack.Screen name="NurseMain" component={NurseDrawerNavigator} />
            )}
            {user.role === 'patient' && (
              <Stack.Screen name="PatientMain" component={PatientDrawerNavigator} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
