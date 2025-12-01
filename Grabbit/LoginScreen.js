import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { globalStyles, colors } from './styles/styles';
import { profileStyles } from './styles/profileStyles';
import { useAuth } from './AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Please enter either email or phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[LoginScreen] Attempting login...');
      const result = await login({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      console.log('[LoginScreen] Login successful:', result);
    } catch (err) {
      console.error('[LoginScreen] Login error:', err);
      setError(err.message || 'Login failed');
      Alert.alert('Login Error', err.message || 'Failed to login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick login buttons for testing with 2 accounts
  const quickLogin = async (account) => {
    setIsSubmitting(true);
    setError('');
    try {
      if (account === 1) {
        await login({
          name: 'Alice',
          email: 'alice@example.com',
          phone: '555-111-2222',
        });
      } else {
        await login({
          name: 'Bob',
          email: 'bob@example.com',
          phone: '555-333-4444',
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      Alert.alert('Error', err.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[globalStyles.container, { justifyContent: 'center', padding: 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <View style={[profileStyles.avatarLarge, { marginTop: 0, marginBottom: 12 }]}>
          <Text style={profileStyles.avatarTextLarge}>Me</Text>
        </View>
        <Text style={profileStyles.userName}>Welcome to Grabbit</Text>
        <Text style={profileStyles.userInfoText}>Sign in to start sharing events</Text>
      </View>

      <View style={profileStyles.sectionCard}>
        <Text style={[profileStyles.userInfoText, { marginBottom: 8, fontWeight: '600' }]}>Name *</Text>
        <TextInput
          style={profileStyles.modalInput}
          placeholder="Your name"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
        />
        <Text style={[profileStyles.userInfoText, { marginBottom: 8, marginTop: 12, fontWeight: '600' }]}>Email</Text>
        <TextInput
          style={profileStyles.modalInput}
          placeholder="your@email.com"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={[profileStyles.userInfoText, { marginBottom: 8, marginTop: 12, fontWeight: '600' }]}>Phone</Text>
        <TextInput
          style={profileStyles.modalInput}
          placeholder="555-123-4567"
          placeholderTextColor={colors.placeholder}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        {error ? (
          <Text style={[profileStyles.userInfoText, { color: colors.accent, marginTop: 8, marginBottom: 8 }]}>
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[profileStyles.friendModalPrimaryButton, { alignSelf: 'flex-start', opacity: isSubmitting ? 0.6 : 1, marginTop: 8 }]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome5 name="sign-in-alt" size={14} color="#fff" style={{ marginRight: 8 }} />
            <Text style={profileStyles.friendModalPrimaryText}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[profileStyles.sectionCard, { marginTop: 16 }]}>
        <Text style={[profileStyles.userInfoText, { marginBottom: 12, fontWeight: '600', textAlign: 'center' }]}>
          Quick Test (2 Accounts)
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[profileStyles.friendModalPrimaryButton, { flex: 1, backgroundColor: '#e55347', opacity: isSubmitting ? 0.6 : 1 }]}
            onPress={() => quickLogin(1)}
            disabled={isSubmitting}
          >
            <Text style={profileStyles.friendModalPrimaryText}>Login as Alice</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[profileStyles.friendModalPrimaryButton, { flex: 1, backgroundColor: '#34495e', opacity: isSubmitting ? 0.6 : 1 }]}
            onPress={() => quickLogin(2)}
            disabled={isSubmitting}
          >
            <Text style={profileStyles.friendModalPrimaryText}>Login as Bob</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
