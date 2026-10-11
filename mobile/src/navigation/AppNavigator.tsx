import React, { useEffect } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Linking } from 'react-native';
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

// Pharmacy Drawer Navigator
import PharmacyDrawerNavigator from './PharmacyDrawerNavigator';

const Stack = createNativeStackNavigator();

const linking: LinkingOptions<any> = {
  prefixes: ['pmedaid://', 'https://pmedaid.app', 'exp://'],
  config: {
    screens: {
      Auth: 'auth',
      Register: 'register',
    },
  },
};

export default function AppNavigator() {
  const { user, loading, logout } = useAuth();
  const navigationRef = React.useRef<any>(null);

  // Handle deep links from QR codes
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log('Deep link received:', url);
      
      // Extract QR code data from URL if present
      const qrCode = url.split('qr=')[1] || url.split('code=')[1];
      
      // If user is logged in, logout first
      if (user) {
        logout().then(() => {
          console.log('Auth cleared, will redirect to login after state update');
          // Note: Navigation will automatically switch to Auth screen when user state becomes null
        }).catch((error) => {
          console.error('Error during logout:', error);
        });
      } else {
        // User is not logged in, navigate directly to Auth with QR code
        if (navigationRef.current) {
          navigationRef.current.navigate('Auth', { qrCode: qrCode || null });
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [logout, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#1d64c1' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
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
            {user.role === 'pharmacy' && (
              <Stack.Screen name="PharmacyMain" component={PharmacyDrawerNavigator} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
