import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';
import { PlaceholderHomeScreen } from '@/screens/PlaceholderHomeScreen';
import { useAuth } from './AuthContext';

/**
 * Mounting AuthStack vs. the main app as siblings (rather than nesting
 * one inside the other) is what gives us the "reset, not push" behavior
 * the spec requires for both Login->Dashboard and Logout->Login: the
 * previous stack is unmounted entirely, not just popped.
 *
 * PlaceholderHomeScreen stands in for the real Main Tabs navigator
 * (Home/Verify/Reports/Settings) that Phase 2 introduces.
 */
export function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <PlaceholderHomeScreen /> : <AuthStack />}
    </NavigationContainer>
  );
}
