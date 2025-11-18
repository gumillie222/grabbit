// ProfileScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons'; // Assuming you have FontAwesome5 installed

import { profileStyles } from './styles/profileStyles'; // Import custom styles
import { globalStyles, colors } from './styles/styles'; // Assuming you have global styles and colors

export default function ProfileScreen() {
  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={profileStyles.profileContainer}>

        {/* Top Icons */}
        <View style={profileStyles.topIcons}>
          <TouchableOpacity style={profileStyles.iconButton}>
            <FontAwesome5 name="external-link-alt" size={20} color={colors.iconColor} />
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.iconButton}>
            <FontAwesome5 name="cog" size={20} color={colors.iconColor} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={profileStyles.avatarLarge}>
          <Text style={profileStyles.avatarTextLarge}>Me</Text>
        </View>

        {/* User Info */}
        <Text style={profileStyles.userName}>Millie Gu</Text>
        <Text style={profileStyles.userInfoText}>508-667-1234</Text>
        <Text style={profileStyles.userInfoText}>gumillie@wharton.upenn.edu</Text>

        {/* Bottom Navigation Placeholder (as seen in the image, assuming it's part of a parent navigator) */}
        {/* We won't implement the actual Tab.Navigator here, but keep the placeholder structure */}
        {/* This will typically be rendered by the Tab.Navigator higher up in the component tree */}
        {/* <View style={profileStyles.bottomNavBar}>
          <TouchableOpacity style={profileStyles.navItem}>
            <FontAwesome5 name="list-alt" size={24} color={colors.tabInactive} />
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.navItem}>
            <FontAwesome5 name="user-alt" size={24} color={colors.tabActive} />
          </TouchableOpacity>
        </View> */}

      </View>
    </SafeAreaView>
  );
}