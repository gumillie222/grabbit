// ProfileScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons'; 

import { profileStyles } from './styles/profileStyles'; 
import { globalStyles, colors } from './styles/styles'; 

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    name: 'Grab Bit',
    phone: '508-667-1234',
    email: 'grabbit@upenn.edu',
  });
  const [editVisible, setEditVisible] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftPhone, setDraftPhone] = useState(profile.phone);
  const [draftEmail, setDraftEmail] = useState(profile.email);

  const openEdit = () => {
    setDraftName(profile.name);
    setDraftPhone(profile.phone);
    setDraftEmail(profile.email);
    setEditVisible(true);
  };

  const saveEdits = () => {
    setProfile((prev) => ({
      ...prev,
      name: draftName.trim() || prev.name,
      phone: draftPhone.trim() || prev.phone,
      email: draftEmail.trim() || prev.email,
    }));
    setEditVisible(false);
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={profileStyles.profileContainer}>

        {/* Top Icons */}
        <View style={profileStyles.topIcons}>
          <TouchableOpacity style={profileStyles.iconButton} onPress={openEdit}>
            <FontAwesome5 name="edit" size={20} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.iconButton}>
            <FontAwesome5 name="cog" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={profileStyles.avatarLarge}>
          <Text style={profileStyles.avatarTextLarge}>Me</Text>
        </View>

        {/* User Info */}
        <Text style={profileStyles.userName}>{profile.name}</Text>
        <Text style={profileStyles.userInfoText}>{profile.phone}</Text>
        <Text style={profileStyles.userInfoText}>{profile.email}</Text>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={editVisible}
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={profileStyles.modalContainer}>
            <Text style={profileStyles.modalTitle}>Edit profile</Text>
            <TextInput
              style={profileStyles.modalInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Name"
              placeholderTextColor={colors.placeholder}
            />
            <TextInput
              style={profileStyles.modalInput}
              value={draftPhone}
              onChangeText={setDraftPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
            />
            <TextInput
              style={profileStyles.modalInput}
              value={draftEmail}
              onChangeText={setDraftEmail}
              placeholder="Email address"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={profileStyles.modalButtonRow}>
              <TouchableOpacity
                style={[profileStyles.modalButton, profileStyles.cancelButton]}
                onPress={() => setEditVisible(false)}
              >
                <Text style={profileStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[profileStyles.modalButton, profileStyles.saveButton]}
                onPress={saveEdits}
              >
                <Text style={profileStyles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
