import React, { createContext, useEffect, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from './config';

const AUTH_KEY = 'grabbit:auth:v1';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Load user on start - auto-login Bob if no user is saved
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(AUTH_KEY);
        if (saved) {
          const user = JSON.parse(saved);
          
          // Migrate old email addresses to grabbit.com domain
          if (user.id === 'alice' && user.email === 'alice@example.com') {
            user.email = 'alice@grabbit.com';
            await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
          } else if (user.id === 'bob' && user.email === 'bob@example.com') {
            user.email = 'bob@grabbit.com';
            await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
          }
          
          setCurrentUser(user);
          // Register with backend and wait for it to complete
          await registerUserWithBackend(user).catch(err => {
            // Network errors are expected if server is offline - don't log as error
            if (err.message?.includes('Network request failed') || err.message?.includes('Failed to fetch')) {
              console.warn('[Auth] Server may be offline - registration skipped:', err.message);
            } else {
              console.error('[Auth] Background registration failed on load:', err);
            }
          });
        } else {
          // Auto-login Bob as default user
          const defaultUser = {
            id: 'bob',
            name: 'Bob',
            email: 'bob@grabbit.com',
            phone: '555-333-4444',
          };
          setCurrentUser(defaultUser);
          await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(defaultUser));
          // Register with backend and wait for it to complete
          await registerUserWithBackend(defaultUser).catch(err => {
            // Network errors are expected if server is offline - don't log as error
            if (err.message?.includes('Network request failed') || err.message?.includes('Failed to fetch')) {
              console.warn('[Auth] Server may be offline - registration skipped:', err.message);
            } else {
              console.error('[Auth] Background registration failed on load:', err);
            }
          });
        }
      } catch (err) {
        // Fallback: auto-login Bob even on error
        const defaultUser = {
          id: 'bob',
          name: 'Bob',
          email: 'bob@grabbit.com',
          phone: '555-333-4444',
        };
        setCurrentUser(defaultUser);
      } finally {
        setAuthLoading(false);
      }
    };
    load();
  }, []);

  const registerUserWithBackend = async (user) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${SERVER_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Auth] Failed to register with backend:', errorText);
        return false;
      }
      return true;
    } catch (err) {
      // Network errors are expected if server is offline - don't log as error
      if (err.name === 'AbortError' || err.message?.includes('Network request failed') || err.message?.includes('Failed to fetch')) {
        console.warn('[Auth] Server may be offline - registration skipped:', err.message);
      } else {
        console.error('[Auth] Error registering with backend:', err.message);
      }
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

      // Save locally first (don't wait for backend)
      setCurrentUser(user);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
      
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
      // Failed to clear user
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
          email: 'alice@grabbit.com',
          phone: '555-111-2222',
        };
      } else {
        newUser = {
          id: 'bob',
          name: 'Bob',
          email: 'bob@grabbit.com',
          phone: '555-333-4444',
        };
      }
      
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
