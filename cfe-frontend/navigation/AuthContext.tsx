import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { getAuthSession, setAuthSession } from '@/utils/userPreferences';

// Auth state driven by persistent session management + Firebase Auth
// Sessions persist reliably across app restarts, backgrounding, and home navigation.

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getAuthSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial check for active session or Firebase user
    const isSessionActive = getAuthSession();
    const currentUser = auth().currentUser;
    if (currentUser || isSessionActive) {
      setIsAuthenticated(true);
    }
    setLoading(false);

    // Listen for Firebase Auth state changes
    const unsubscribe = auth().onAuthStateChanged(user => {
      const active = getAuthSession();
      if (user || active) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      loading,
      login: () => {
        setAuthSession(true);
        setIsAuthenticated(true);
      },
      logout: () => {
        setAuthSession(false);
        auth().signOut().catch(() => {});
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
