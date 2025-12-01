import React, { createContext, useEffect, useRef, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = 'grabbit:auth:v1';
const DEMO_EMAIL = 'demo@grabbit.app';
const DEMO_PASSWORD = 'demo123';
const DEMO_TOKEN = 'grabbit-demo-token';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const loadingTimeout = useRef(null);

  // Load token on start
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(AUTH_KEY);
        if (saved) setAuthToken(saved);
      } catch (err) {
        console.log('[Auth] Failed to load token:', err.message);
      } finally {
        setAuthLoading(false);
      }
    };
    load();

    return () => {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    };
  }, []);

  const login = async (email, password) => {
    const e = (email || '').trim().toLowerCase();
    const p = (password || '').trim();
    if (e === DEMO_EMAIL && p === DEMO_PASSWORD) {
      setAuthToken(DEMO_TOKEN);
      await AsyncStorage.setItem(AUTH_KEY, DEMO_TOKEN);
      return true;
    }
    throw new Error('Invalid email or password');
  };

  const logout = async () => {
    setAuthToken(null);
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (err) {
      console.log('[Auth] Failed to clear token:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthed: !!authToken,
        authLoading,
        login,
        logout,
        authToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
