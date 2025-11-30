import React, { useState, useContext } from 'react';
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

import { globalStyles, colors } from './styles/styles.js';
import { homeStyles } from './styles/homeStyles.js';
import AddEventModal from './AddEventModal.js';
import { EventContext } from './EventContext';

export default function HomeScreen({ navigation }) {
  const {
    events,
    addEvent,
    updateItems,
    updateParticipants,
    deleteEvent,
    archiveEvent,
  } = useContext(EventContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

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
      participants: event.participants || (event.isNew ? ['Me'] : ['Me', 'A']),
    });
  };

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleAddEvent = (newEvent) => {
    addEvent(newEvent);
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
    archiveEvent(id);
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
                    Are you sure you want to delete this event?
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

// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StatusBar,
//   Modal,
//   KeyboardAvoidingView,
//   Platform,
//   TouchableWithoutFeedback,
// } from 'react-native';
// import { FontAwesome5 } from '@expo/vector-icons';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import eventsData from './data.json';
// import { globalStyles, colors, fonts } from './styles/styles.js'; 
// import { homeStyles } from './styles/homeStyles.js';
// import AddEventModal from './AddEventModal.js'; 

// export default function HomeScreen({ navigation }) {


//   const [events, setEvents] = useState(
//     eventsData.map(e => ({ ...e, isNew: false }))
//   );
//   const [modalVisible, setModalVisible] = useState(false);
//   const [deleteModalVisible, setDeleteModalVisible] = useState(false);
//   const [eventToDelete, setEventToDelete] = useState(null);

//   // Create update functions that can be passed to EventDetailScreen
//   const handleUpdateItems = (eventId, updatedItems) => {
//     setEvents(currentEvents => 
//       currentEvents.map(e => 
//         e.id === eventId ? { ...e, items: updatedItems } : e
//       )
//     );
//   };

//   const handleUpdateParticipants = (eventId, updatedParticipants) => {
//     setEvents(currentEvents => 
//       currentEvents.map(e => 
//         e.id === eventId ? { ...e, participants: updatedParticipants } : e
//       )
//     );
//   };

//   const handlePress = (event) => {
//     navigation.navigate('EventDetail', { 
//       eventId: event.id,
//       eventTitle: event.title,
//       isNew: event.isNew ?? false,
//       initialItems: event.items || [],
//       participants: event.participants || (event.isNew ? ['Me'] : ['Me', 'A']),
//       onUpdateItems: handleUpdateItems,
//       onUpdateParticipants: handleUpdateParticipants
//     });
//   };

//   const handleOpenModal = () => {
//     setModalVisible(true);
//   };

//   const handleCloseModal = () => {
//     setModalVisible(false);
//   };

//   const handleAddEvent = (newEvent) => {
//     setEvents(currentEvents => [{
//       ...newEvent,
//       items: [],
//       participants: ['Me']
//     }, ...currentEvents]);
//   };

//   const handleDeleteEvent = (id) => {
//     setEventToDelete(id);
//     setDeleteModalVisible(true);
//   };

//   const confirmDelete = () => {
//     if (eventToDelete) {
//       setEvents(currentEvents => currentEvents.filter(e => e.id !== eventToDelete));
//       setDeleteModalVisible(false);
//       setEventToDelete(null);
//     }
//   };

//   const cancelDelete = () => {
//     setDeleteModalVisible(false);
//     setEventToDelete(null);
//   };

//   return (
//     <SafeAreaView style={globalStyles.container}>
//       <StatusBar barStyle="dark-content" />

//       <AddEventModal
//         visible={modalVisible}
//         onClose={handleCloseModal}
//         onAddEvent={handleAddEvent}
//         navigation={navigation}
//         onUpdateItems={handleUpdateItems}
//         onUpdateParticipants={handleUpdateParticipants}
//       />
      
//       <View style={homeStyles.header}>
//         <Text style={homeStyles.headerTitle}>Grabbit.</Text>
//         <TouchableOpacity style={homeStyles.addButton} onPress={handleOpenModal}>
//           <FontAwesome5 name="plus" size={30} color={colors.background} />
//         </TouchableOpacity>
//       </View>

//       <ScrollView contentContainerStyle={homeStyles.scrollContent}>
//         <View style={homeStyles.grid}>
//           {events.map((item) => (
//             <View key={item.id} style={homeStyles.cardWrapper}>
//               {/* DELETE BUBBLE */}
//               <TouchableOpacity
//                 style={homeStyles.deleteBubble}
//                 onPress={() => handleDeleteEvent(item.id)}
//               >
//                 <FontAwesome5 name="times" size={16} color={colors.accent} />
//               </TouchableOpacity>

//               {/* CARD ITSELF */}
//               <TouchableOpacity
//                 style={homeStyles.card}
//                 onPress={() => handlePress(item)}
//               >
//                 <Text style={homeStyles.cardTitle}>{item.title}</Text>
//               </TouchableOpacity>
//             </View>
//           ))}
//         </View>
//       </ScrollView>

//       {/* ---- DELETE CONFIRMATION MODAL ---- */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={deleteModalVisible}
//         onRequestClose={cancelDelete}
//       >
//         <TouchableWithoutFeedback onPress={cancelDelete}>
//           <View style={globalStyles.modalOverlay}>
//             <KeyboardAvoidingView
//               behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//               style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
//             >
//               <TouchableWithoutFeedback onPress={() => {}}>
//                 <View style={homeStyles.deleteModalContainer}>
//                   <Text style={homeStyles.deleteModalTitle}>Delete Event</Text>
//                   <Text style={homeStyles.deleteModalMessage}>
//                     Are you sure you want to delete this event?
//                   </Text>
//                   <View style={homeStyles.deleteModalActions}>
//                     <TouchableOpacity
//                       style={homeStyles.deleteModalCancelBtn}
//                       onPress={cancelDelete}
//                     >
//                       <FontAwesome5 name="times" size={16} color="#fff" />
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={homeStyles.deleteModalConfirmBtn}
//                       onPress={confirmDelete}
//                     >
//                       <FontAwesome5 name="check" size={16} color="#fff" />
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               </TouchableWithoutFeedback>
//             </KeyboardAvoidingView>
//           </View>
//         </TouchableWithoutFeedback>
//       </Modal>
//     </SafeAreaView>
//   );
// }