import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';
import { HomeDashboardScreen } from '@/screens/HomeDashboardScreen';
import { useAuth } from './AuthContext';

export function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();

  // Wait for AsyncStorage to restore auth state before rendering
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a1a' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <HomeDashboardScreen /> : <AuthStack />}
    </NavigationContainer>
  );
}
