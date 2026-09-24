import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenTemplate from '../../components/ScreenTemplate';

export default function MedicationPlans() {
  return (
    <ScreenTemplate title="Medication Plans">
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>📝 Medication Plans</Text>
        <Text style={styles.placeholderSubtext}>
          Schedule and manage medication plans for patients
        </Text>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  placeholder: { padding: 40, alignItems: 'center' },
  placeholderText: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  placeholderSubtext: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});

