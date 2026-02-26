import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types';

// 1. Context Type එක
interface AuthContextType {
  user: User | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// 2. Context එක Export කරන්න (වෙනම ෆයිල් එකක useAuth හදන්න ඕන නිසා)
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Settings ---
const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // පැය 1යි

// 3. AuthProvider Component එක පමණක් මෙහි තියන්න
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateActivity = () => {
    if (user) {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const lastActivity = localStorage.getItem('lastActivity');

    if (storedUser && token) {
      if (lastActivity) {
        const timeDiff = Date.now() - parseInt(lastActivity);
        if (timeDiff > INACTIVITY_LIMIT_MS) {
          console.log("Session expired");
          logout();
          return;
        }
      }

      try {
        if (storedUser === 'undefined') throw new Error('Corrupt data');
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        updateActivity();
      } catch (error) {
        logout();
      }
    }
  }, [logout]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleUserActivity = () => updateActivity();

    events.forEach(event => window.addEventListener(event, handleUserActivity));

    const intervalId = setInterval(() => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const timeDiff = Date.now() - parseInt(lastActivity);
        if (timeDiff > INACTIVITY_LIMIT_MS) {
          logout();
          alert("Your session has expired due to inactivity.");
        }
      }
    }, 10000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
      clearInterval(intervalId);
    };
  }, [user, logout]);

  const login = (data: AuthResponse) => {
    if (!data.user || !data.token) return;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('lastActivity', Date.now().toString());
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};