// HomeScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

// --- NO FONT IMPORTS HERE ANYMORE ---

import { eventsData } from './data/homeScreenData.js';
import { globalStyles, colors } from './styles/styles.js'; 
import { homeStyles } from './styles/homeStyles.js'; 

export default function HomeScreen({ navigation }) {

  const [events, setEvents] = useState(eventsData);
  const [newGroupName, setNewGroupName] = useState('');
  const [newComments, setNewComments] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // --- REMOVED useFonts HOOK & Loading Check --- 
  // (Assumes fonts are loaded in App.js before this screen mounts)

  const handlePress = (eventTitle) => {
    navigation.navigate('EventDetail', { eventTitle: eventTitle });
  };

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

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={homeStyles.modalContainer}>
            
            <Text style={homeStyles.modalLabel}>Group Name</Text>
            <TextInput
              style={homeStyles.modalInput}
              placeholder="Enter group name..."
              placeholderTextColor={colors.modalPlaceholder}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <View style={homeStyles.participantsRow}>
              <FontAwesome5 name="users" size={24} color={colors.text} />
              <TouchableOpacity style={homeStyles.participantButton}>
                <Text style={homeStyles.participantButtonText}>Me</Text>
              </TouchableOpacity>
              <TouchableOpacity style={homeStyles.participantAddButton}>
                <FontAwesome5 name="plus" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={homeStyles.modalCommentLabel}>Comments</Text>
            <TextInput
              style={homeStyles.commentsInput}
              placeholder="Tell us a bit about this gathering..."
              placeholderTextColor={colors.modalPlaceholder}
              multiline={true}
              numberOfLines={4}
              value={newComments}
              onChangeText={setNewComments}
            />

            <View style={homeStyles.modalButtonRow}>
              <TouchableOpacity
                style={[homeStyles.modalActionButton, homeStyles.closeButton]}
                onPress={handleCloseModal}
              >
                <FontAwesome5 name="times" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[homeStyles.modalActionButton, homeStyles.confirmButton]}
                onPress={handleAddNewGroup}
              >
                <FontAwesome5 name="check" size={24} color="white" />
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
      
      <View style={homeStyles.header}>
        <Text style={homeStyles.headerTitle}>Grabbit.</Text>
        <TouchableOpacity style={homeStyles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={homeStyles.scrollContent}>
        <View style={homeStyles.grid}>
          {events.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={homeStyles.card} 
              onPress={() => handlePress(item.title)}
            >
              <Text style={homeStyles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}