import React, { createContext, useEffect, useRef, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from './config';

const AUTH_KEY = 'grabbit:auth:v1';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const loadingTimeout = useRef(null);

  // Load user on start - auto-login Bob if no user is saved
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(AUTH_KEY);
        if (saved) {
          const user = JSON.parse(saved);
          setCurrentUser(user);
          // Register with backend and wait for it to complete
          await registerUserWithBackend(user).catch(err => {
            console.error('[Auth] Background registration failed on load:', err);
          });
        } else {
          // Auto-login Bob as default user
          const defaultUser = {
            id: 'bob',
            name: 'Bob',
            email: 'bob@example.com',
            phone: '555-333-4444',
          };
          setCurrentUser(defaultUser);
          await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(defaultUser));
          // Register with backend and wait for it to complete
          await registerUserWithBackend(defaultUser).catch(err => {
            console.error('[Auth] Background registration failed on load:', err);
          });
        }
      } catch (err) {
        console.log('[Auth] Failed to load user:', err.message);
        // Fallback: auto-login Bob even on error
        const defaultUser = {
          id: 'bob',
          name: 'Bob',
          email: 'bob@example.com',
          phone: '555-333-4444',
        };
        setCurrentUser(defaultUser);
      } finally {
        setAuthLoading(false);
      }
    };
    load();

    return () => {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    };
  }, []);

  const registerUserWithBackend = async (user) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Auth] Failed to register with backend:', errorText);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Auth] Error registering with backend:', err.message);
      // Don't throw - allow login to proceed even if backend is unavailable
      return false;
    }
  };

  const login = async (userData) => {
    try {
      // userData should have: { id, name, email, phone }
      const user = {
        id: userData.id || `user_${Date.now()}`,
        name: userData.name,
        email: userData.email || '',
        phone: userData.phone || '',
      };

      console.log('[Auth] Logging in user:', user.name);

      // Save locally first (don't wait for backend)
      setCurrentUser(user);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
      
      console.log('[Auth] User saved locally, currentUser set');
      
      // Register with backend in background (non-blocking)
      registerUserWithBackend(user).catch(err => {
        console.error('[Auth] Background registration failed:', err);
      });
      
      return user;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (err) {
      console.log('[Auth] Failed to clear user:', err.message);
    }
  };

  const switchAccount = async () => {
    try {
      // Switch between Bob and Alice
      const currentName = currentUser?.name?.toLowerCase();
      let newUser;
      
      if (currentName === 'bob') {
        newUser = {
          id: 'alice',
          name: 'Alice',
          email: 'alice@example.com',
          phone: '555-111-2222',
        };
      } else {
        newUser = {
          id: 'bob',
          name: 'Bob',
          email: 'bob@example.com',
          phone: '555-333-4444',
        };
      }
      
      console.log('[Auth] Switching account to:', newUser.name);
      setCurrentUser(newUser);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
      
      // Register with backend in background (non-blocking)
      registerUserWithBackend(newUser).catch(err => {
        console.error('[Auth] Background registration failed:', err);
      });
      
      return newUser;
    } catch (error) {
      console.error('[Auth] Switch account error:', error);
      throw error;
    }
  };

  const updateUser = async (updates) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    await registerUserWithBackend(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthed: !!currentUser,
        authLoading,
        login,
        logout,
        switchAccount,
        updateUser,
        currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
