import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';

// Auth state driven by Firebase Auth — sessions persist automatically
// across app restarts and backgrounding. No manual token storage needed.

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Auth automatically restores the session on app launch.
    // onAuthStateChanged fires once immediately with the current user (or null).
    const unsubscribe = auth().onAuthStateChanged(user => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      loading,
      login: () => setIsAuthenticated(true),
      logout: () => {
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
