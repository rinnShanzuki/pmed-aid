import React from 'react';
import { View, StyleSheet } from 'react-native';
import PatientBottomNav from './PatientBottomNav';

interface PatientScreenWrapperProps {
  navigation: any;
  currentRoute: string;
  children: React.ReactNode;
}

export default function PatientScreenWrapper({ 
  navigation, 
  currentRoute, 
  children 
}: PatientScreenWrapperProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      <PatientBottomNav navigation={navigation} currentRoute={currentRoute} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
