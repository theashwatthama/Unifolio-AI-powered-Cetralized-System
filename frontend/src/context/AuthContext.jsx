import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'unifolio-user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const persisted = localStorage.getItem(STORAGE_KEY);
      return persisted ? JSON.parse(persisted) : null;
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const login = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
