// ProfileScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons'; 

import { profileStyles } from './styles/profileStyles'; 
import { globalStyles, colors } from './styles/styles'; 

export default function ProfileScreen() {
  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={profileStyles.profileContainer}>

        {/* Top Icons */}
        <View style={profileStyles.topIcons}>
          <TouchableOpacity style={profileStyles.iconButton}>
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
        <Text style={profileStyles.userName}>Grab Bit</Text>
        <Text style={profileStyles.userInfoText}>508-667-1234</Text>
        <Text style={profileStyles.userInfoText}>grabbit@upenn.edu</Text>
      </View>
    </SafeAreaView>
  );
}