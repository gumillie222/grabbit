import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import {
  useFonts,
  JosefinSans_300Light,
  JosefinSans_400Regular,
  JosefinSans_700Bold,
  JosefinSans_300Light_Italic,
  JosefinSans_400Regular_Italic,
  JosefinSans_700Bold_Italic
} from '@expo-google-fonts/josefin-sans';

import { eventsData } from './data/homeScreenData.js';
import { styles, colors } from './styles.js';

// The 'navigation' prop is passed in from the Stack Navigator
export default function HomeScreen({ navigation }) {

  const [events, setEvents] = useState(eventsData);
  const [newGroupName, setNewGroupName] = useState('');
  const [newComments, setNewComments] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // --- Font Loading ---
  let [fontsLoaded, fontError] = useFonts({
    JosefinSans_300Light,
    JosefinSans_400Regular,
    JosefinSans_700Bold,
    JosefinSans_300Light_Italic,
    JosefinSans_400Regular_Italic,
    JosefinSans_700Bold_Italic
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  // --- THIS IS THE KEY CHANGE ---
  const handlePress = (eventTitle) => {
    // This 'EventDetail' must match the name in HomeStackNavigator.js
    // We pass the title as a parameter, which EventDetailScreen will receive.
    navigation.navigate('EventDetail', { eventTitle: eventTitle });
  };
  // --- END CHANGE ---

  // --- Modal Logic ---
  const handleAddNewGroup = () => {
    if (newGroupName.trim() === '') return;

    const newEvent = {
      id: Date.now(),
      title: newGroupName,
      icon: null,
      library: null,
    };

    setEvents(currentEvents => [newEvent, ...currentEvents]);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setNewGroupName('');
    setNewComments('');
  }
  // --- End Modal Logic ---

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* --- Add New Group Modal --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Group Name Input */}
            <Text style={[styles.modalLabel, { fontFamily: 'JosefinSans_700Bold' }]}>Group Name</Text>
            <TextInput
              style={[styles.modalInput, { fontFamily: 'JosefinSans_400Regular' }]}
              placeholder="Enter group name..."
              placeholderTextColor={colors.modalPlaceholder}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            {/* Participants */}
            <View style={styles.participantsRow}>
              <FontAwesome5 name="users" size={24} color={colors.text} />
              <TouchableOpacity style={styles.participantButton}>
                <Text style={[styles.participantButtonText, { fontFamily: 'JosefinSans_700Bold' }]}>Me</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.participantAddButton}>
                <FontAwesome5 name="plus" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Comments Input */}
            <Text style={[styles.modalCommentLabel, { fontFamily: 'JosefinSans_700Bold' }]}>Comments</Text>
            <TextInput
              style={[styles.commentsInput, { fontFamily: 'JosefinSans_400Regular' }]}
              placeholder="Tell us a bit about this gathering..."
              placeholderTextColor={colors.modalPlaceholder}
              multiline={true}
              numberOfLines={4}
              value={newComments}
              onChangeText={setNewComments}
            />

            {/* Action Buttons */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.closeButton]}
                onPress={handleCloseModal}
              >
                <FontAwesome5 name="times" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.confirmButton]}
                onPress={handleAddNewGroup}
              >
                <FontAwesome5 name="check" size={24} color="white" />
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
      {/* --- End Modal --- */}
      
      {/* --- Header --- */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontFamily: 'JosefinSans_700Bold' }]}>Grabbit.</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- Main Grid Content --- */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          
          {events.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card} 
              // The onPress prop now calls our navigation function
              onPress={() => handlePress(item.title)}
            >
              <Text style={[styles.cardTitle, { fontFamily: 'JosefinSans_400Regular' }]}>{item.title}</Text>
              
            </TouchableOpacity>
          ))}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}