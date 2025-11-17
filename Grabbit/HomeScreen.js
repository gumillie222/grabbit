import React, { useState } from 'react'; // Import useState
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal, // Import Modal
  TextInput // Import TextInput
} from 'react-native';
// Import FontAwesome5 for the new icons
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

export default function HomeScreen({ navigation }) {

  // --- CHANGES ---
  // 1. Keep track of the events in state, starting with the imported data
  const [events, setEvents] = useState(eventsData); 
  // 2. State for the modal's inputs
  const [newGroupName, setNewGroupName] = useState('');
  const [newComments, setNewComments] = useState('');
  // 3. State to control modal visibility
  const [modalVisible, setModalVisible] = useState(false);
  // --- END CHANGES ---

  // 1. Load Fonts
  let [fontsLoaded, fontError] = useFonts({
    JosefinSans_300Light,
    JosefinSans_400Regular,
    JosefinSans_700Bold,
    JosefinSans_300Light_Italic,
    JosefinSans_400Regular_Italic,
    JosefinSans_700Bold_Italic
  });

  // 2. Show Loading Spinner while fonts load
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background}}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  const handlePress = (eventTitle) => {
    console.log(`User clicked on: ${eventTitle}`);
    // navigation.navigate('EventDetails', { title: eventTitle });
  };

  // --- UPDATED ---
  const handleAddNewGroup = () => {
    // 1. Don't add if the name is empty
    if (newGroupName.trim() === '') {
      // (In a real app, show an error message)
      return; 
    }

    // 2. Create the new event object
    const newEvent = {
      id: Date.now(), // Use a timestamp as a unique ID
      title: newGroupName,
      icon: null, // You could add logic to pick an icon
      library: null,
      // You could also save the 'newComments' here
    };

    // 3. Add the new event to the *beginning* of the list
    setEvents(currentEvents => [newEvent, ...currentEvents]);

    // 4. Close modal and reset inputs
    setModalVisible(false);
    setNewGroupName('');
    setNewComments('');
  };

  // --- NEW ---
  // Helper function to reset inputs when modal is closed
  const handleCloseModal = () => {
    setModalVisible(false);
    setNewGroupName('');
    setNewComments('');
  }
  // --- END NEW ---

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* --- NEW MODAL COMPONENT --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal} // Use helper function
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Group Name Input */}
            <Text style={[styles.modalLabel, {fontFamily: 'JosefinSans_700Bold'}]}>Group Name</Text>
            {/* --- UPDATED ---
               - Added value and onChangeText
               --- */}
            <TextInput
              style={[styles.modalInput, {fontFamily: 'JosefinSans_400Regular'}]}
              placeholder="Enter group name..."
              placeholderTextColor={colors.modalPlaceholder}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            {/* Participants */}
            <View style={styles.participantsRow}>
              <FontAwesome5 name="users" size={24} color={colors.text} />
              <TouchableOpacity style={styles.participantButton}>
                <Text style={[styles.participantButtonText, {fontFamily: 'JosefinSans_700Bold'}]}>Me</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.participantAddButton}>
                <FontAwesome5 name="plus" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Comments Input */}
            <Text style={[styles.modalCommentLabel, {fontFamily: 'JosefinSans_700Bold'}]}>Comments</Text>
            {/* --- UPDATED ---
               - Added value and onChangeText
               --- */}
            <TextInput
              style={[styles.commentsInput, {fontFamily: 'JosefinSans_400Regular'}]}
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
                onPress={handleCloseModal} // Use helper function
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
      {/* --- END MODAL --- */}
      
      {/* --- Header --- */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontFamily: 'JosefinSans_700Bold' }]}>Grabbit.</Text>
        {/* --- UPDATED ---
           - Add button now opens the modal
           --- */}
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- Main Grid Content --- */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          
          {/* --- UPDATED ---
             - Now maps over the 'events' state variable
             --- */}
          {events.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card} 
              onPress={() => handlePress(item.title)}
            >
              {/* Apply Regular Font Inline */}
              <Text style={[styles.cardTitle, { fontFamily: 'JosefinSans_400Regular' }]}>{item.title}</Text>
              
              {/* Icon block removed */}
              
            </TouchableOpacity>
          ))}

        </View>
      </ScrollView>

      {/* Footer block removed */}

    </SafeAreaView>
  );
}