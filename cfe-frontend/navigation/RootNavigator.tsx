import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthStack } from './AuthStack';
import { HomeDashboardScreen } from '@/screens/HomeDashboardScreen';
import { useAuth } from './AuthContext';

/**
 * Mounting AuthStack vs. the main app as siblings (rather than nesting
 * one inside the other) is what gives us the "reset, not push" behavior
 * the spec requires for both Login->Dashboard and Logout->Login: the
 * previous stack is unmounted entirely, not just popped.
 *
 * HomeDashboardScreen (Phase 2) replaces the throwaway
 * PlaceholderHomeScreen from Phase 1. It is currently mounted directly
 * rather than inside a bottom-tab Navigator — see README "Decisions
 * made" for why a real MainTabs navigator is deferred to Phase 3, when
 * Verify/Reports/Settings first have real destination screens to route
 * to.
 */
export function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <HomeDashboardScreen /> : <AuthStack />}
    </NavigationContainer>
  );
}
