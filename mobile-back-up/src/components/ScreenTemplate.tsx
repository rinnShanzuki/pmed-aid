import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

interface ScreenTemplateProps {
  title: string;
  children?: React.ReactNode;
}

export default function ScreenTemplate({ title, children }: ScreenTemplateProps) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        {children || (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{title}</Text>
            <Text style={styles.userInfo}>
              Logged in as: {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.userInfo}>Role: {user?.role}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1d64c1',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  placeholder: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});
