import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { globalStyles, colors } from './styles/styles.js';
import { homeStyles } from './styles/homeStyles.js';
import AddEventModal from './AddEventModal.js';
import { EventContext } from './EventContext';
import { useAuth } from './AuthContext';
import { api } from './api';

export default function HomeScreen({ navigation }) {
  const {
    events,
    archivedEvents,
    addEvent,
    updateItems,
    updateParticipants,
    deleteEvent,
    archiveEvent,
    reloadEvents,
    // friends list should be kept in EventContext (and updated from ProfileScreen)
    friends = [],
  } = useContext(EventContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [eventToArchive, setEventToArchive] = useState(null);

  // Reload events when screen comes into focus (for real-time updates)
  useFocusEffect(
    React.useCallback(() => {
      console.log('[HomeScreen] Screen focused, reloading events...');
      if (reloadEvents) {
        reloadEvents();
      }
    }, [reloadEvents])
  );

  const handleUpdateItems = (eventId, updatedItems) => {
    updateItems(eventId, updatedItems);
  };

  const handleUpdateParticipants = (eventId, updatedParticipants) => {
    updateParticipants(eventId, updatedParticipants);
  };

  const handlePress = (event) => {
    navigation.navigate('EventDetail', {
      eventId: event.id,
      eventTitle: event.title,
      isNew: event.isNew ?? false,
      initialItems: event.items || [],
      // always respect the participants saved on the event
      participants: event.participants && event.participants.length > 0
        ? event.participants
        : [],
    });
  };

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleAddEvent = (newEvent) => {
    // newEvent already contains the participants chosen in AddEventModal
    addEvent(newEvent);

    // keep EventContext’s participant map in sync if you’re using it
    if (newEvent.id && newEvent.participants) {
      handleUpdateParticipants(newEvent.id, newEvent.participants);
    }

    setModalVisible(false);
  };

  const handleDeleteEvent = (id) => {
    setEventToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete);
      setDeleteModalVisible(false);
      setEventToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setEventToDelete(null);
  };

  const handleArchiveEvent = (id) => {
    setEventToArchive(id);
    setArchiveModalVisible(true);
  };

  const confirmArchive = () => {
    if (eventToArchive) {
      archiveEvent(eventToArchive);
      setArchiveModalVisible(false);
      setEventToArchive(null);
    }
  };

  const cancelArchive = () => {
    setArchiveModalVisible(false);
    setEventToArchive(null);
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" />

      <AddEventModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onAddEvent={handleAddEvent}
        navigation={navigation}
        onUpdateItems={handleUpdateItems}
        onUpdateParticipants={handleUpdateParticipants}
        friends={friends}
        existingEvents={events}
        archivedEvents={archivedEvents}
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
              {/* ARCHIVE BUBBLE (top left) */}
              <TouchableOpacity
                style={homeStyles.archiveBubble}
                onPress={() => handleArchiveEvent(item.id)}
              >
                <FontAwesome5 name="archive" size={14} color={colors.accent} />
              </TouchableOpacity>

              {/* DELETE BUBBLE (top right) */}
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

      {/* ---- ARCHIVE CONFIRMATION MODAL ---- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={archiveModalVisible}
        onRequestClose={cancelArchive}
      >
        <TouchableWithoutFeedback onPress={cancelArchive}>
          <View style={globalStyles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={homeStyles.deleteModalContainer}>
                  <Text style={homeStyles.deleteModalTitle}>Archive Event</Text>
                  <Text style={homeStyles.deleteModalMessage}>
                    Are you sure you want to archive this event? This event will be archived for all participants. You can unarchive it later from the archived events section.
                  </Text>
                  <View style={homeStyles.deleteModalActions}>
                    <TouchableOpacity
                      style={homeStyles.deleteModalCancelBtn}
                      onPress={cancelArchive}
                    >
                      <FontAwesome5 name="times" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={homeStyles.deleteModalConfirmBtn}
                      onPress={confirmArchive}
                    >
                      <FontAwesome5 name="check" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ---- DELETE CONFIRMATION MODAL ---- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={cancelDelete}
      >
        <TouchableWithoutFeedback onPress={cancelDelete}>
          <View style={globalStyles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={homeStyles.deleteModalContainer}>
                  <Text style={homeStyles.deleteModalTitle}>Delete Event</Text>
                  <Text style={homeStyles.deleteModalMessage}>
                    Are you sure you want to delete this event? This action is IRREVERSIBLE. All items and participants will be permanently deleted.
                  </Text>
                  <View style={homeStyles.deleteModalActions}>
                    <TouchableOpacity
                      style={homeStyles.deleteModalCancelBtn}
                      onPress={cancelDelete}
                    >
                      <FontAwesome5 name="times" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={homeStyles.deleteModalConfirmBtn}
                      onPress={confirmDelete}
                    >
                      <FontAwesome5 name="check" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}