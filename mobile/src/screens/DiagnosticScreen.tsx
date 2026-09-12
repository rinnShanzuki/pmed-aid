import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { getBaseURL } from '../config/api.config';

export default function DiagnosticScreen() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // 1. Check API Base URL
      results.baseURL = getBaseURL();

      // 2. Check stored token
      const token = await AsyncStorage.getItem('token');
      results.hasToken = !!token;
      results.tokenPreview = token ? `${token.substring(0, 20)}...` : 'None';

      // 3. Test backend connection (health check)
      try {
        const healthRes = await api.get('/health');
        results.backendHealth = 'Connected ✓';
        results.healthData = healthRes.data;
      } catch (err: any) {
        results.backendHealth = `Error: ${err.message}`;
      }

      // 4. Test auth endpoint
      try {
        const authRes = await api.get('/auth/me');
        results.authStatus = 'Authenticated ✓';
        results.user = authRes.data.data.user;
      } catch (err: any) {
        results.authStatus = `Error ${err.response?.status}: ${err.message}`;
      }

      setStatus(results);
    } catch (err: any) {
      results.error = err.message;
      setStatus(results);
    } finally {
      setLoading(false);
    }
  };

  const clearToken = async () => {
    await AsyncStorage.removeItem('token');
    setStatus({ ...status, hasToken: false, tokenPreview: 'Cleared' });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Diagnostics</Text>
      
      <TouchableOpacity style={styles.button} onPress={runDiagnostics} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run Diagnostics</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearToken}>
        <Text style={styles.buttonText}>Clear Token</Text>
      </TouchableOpacity>

      {status && (
        <View style={styles.results}>
          <Text style={styles.resultTitle}>Results:</Text>
          <Text style={styles.resultText}>API Base URL: {status.baseURL}</Text>
          <Text style={styles.resultText}>Has Token: {status.hasToken ? 'Yes' : 'No'}</Text>
          <Text style={styles.resultText}>Token: {status.tokenPreview}</Text>
          <Text style={styles.resultText}>Backend: {status.backendHealth}</Text>
          <Text style={styles.resultText}>Auth: {status.authStatus}</Text>
          
          {status.user && (
            <View style={styles.userInfo}>
              <Text style={styles.resultText}>User: {status.user.first_name} {status.user.last_name}</Text>
              <Text style={styles.resultText}>Role: {status.user.role}</Text>
              <Text style={styles.resultText}>Email: {status.user.email}</Text>
            </View>
          )}
          
          {status.error && (
            <Text style={styles.errorText}>Error: {status.error}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
  },
  button: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#334155',
  },
  userInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 12,
  },
});
