import React, { createContext, useContext, useMemo, useState } from 'react';

// UI-only auth state. There is no real session/token here — this exists
// purely to drive which navigator (Auth vs Main) is mounted, which is
// what produces the "reset, not push" behavior the spec requires:
// swapping the root navigator unmounts the auth stack entirely, so
// there's nothing to back-navigate into.

interface AuthContextValue {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const value = useMemo(
    () => ({
      isAuthenticated,
      login: () => setIsAuthenticated(true),
      logout: () => setIsAuthenticated(false),
    }),
    [isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
