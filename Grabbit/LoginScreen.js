import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { globalStyles, colors } from './styles/styles';
import { profileStyles } from './styles/profileStyles';
import { useAuth } from './AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
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
        <Text style={profileStyles.userInfoText}>Sign in to continue</Text>
      </View>

      <View style={profileStyles.sectionCard}>
        <TextInput
          style={profileStyles.modalInput}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={profileStyles.modalInput}
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? (
          <Text style={[profileStyles.userInfoText, { color: colors.accent, marginBottom: 8 }]}>
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[profileStyles.friendModalPrimaryButton, { alignSelf: 'flex-start', opacity: isSubmitting ? 0.6 : 1 }]}
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

        <Text style={profileStyles.settingsFooter} style={{ marginTop: 12 }}>
          Demo credentials: demo@grabbit.app / demo123
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
