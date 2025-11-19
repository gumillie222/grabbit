import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { eventsData } from './data/homeScreenData.js';
import { globalStyles, colors } from './styles/styles.js'; 
import { homeStyles } from './styles/homeStyles.js';
import AddEventModal from './AddEventModal.js'; 

export default function HomeScreen({ navigation }) {


  const [events, setEvents] = useState(
    eventsData.map(e => ({ ...e, isNew: false }))
  );
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = (event) => {
    navigation.navigate('EventDetail', { 
      eventTitle: event.title,
      isNew: event.isNew ?? false
    });
  };

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleAddEvent = (newEvent) => {
    setEvents(currentEvents => [newEvent, ...currentEvents]);
  };

  const handleDeleteEvent = (id) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setEvents(currentEvents => currentEvents.filter(e => e.id !== id));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" />

      <AddEventModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onAddEvent={handleAddEvent}
        navigation={navigation}
      />
      
      <View style={homeStyles.header}>
        <Text style={homeStyles.headerTitle}>Grabbit.</Text>
        <TouchableOpacity style={homeStyles.addButton} onPress={handleOpenModal}>
          <FontAwesome5 name="plus" size={30} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={homeStyles.scrollContent}>
        <View style={homeStyles.grid}>
          {events.map((item) => (
            <View key={item.id} style={homeStyles.cardWrapper}>
              {/* DELETE BUBBLE */}
              <TouchableOpacity
                style={homeStyles.deleteBubble}
                onPress={() => handleDeleteEvent(item.id)}
              >
                <FontAwesome5 name="times" size={16} color={colors.accent} />
              </TouchableOpacity>

              {/* CARD ITSELF */}
              <TouchableOpacity
                style={homeStyles.card}
                onPress={() => handlePress(item)}
              >
                <Text style={homeStyles.cardTitle}>{item.title}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}