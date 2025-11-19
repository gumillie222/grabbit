import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { eventsData } from './data/homeScreenData.js';
import { globalStyles, colors } from './styles/styles.js'; 
import { homeStyles } from './styles/homeStyles.js'; 

export default function HomeScreen({ navigation }) {

  // mark initial events as "not new" (templates)
  const [events, setEvents] = useState(
    eventsData.map(e => ({ ...e, isNew: false }))
  );

  // start with EMPTY inputs (no pre-filled “Hotpot”)
  const [newGroupName, setNewGroupName] = useState('');
  const [newComments, setNewComments] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = (event) => {
    navigation.navigate('EventDetail', { 
      eventTitle: event.title,
      isNew: event.isNew ?? false
    });
  };

  const handleAddNewGroup = () => {
    if (newGroupName.trim() === '') return;
    const newEvent = {
      id: Date.now(),
      title: newGroupName,
      icon: null,
      library: null,
      isNew: true,             // this one should open with a fresh list
    };
    setEvents(currentEvents => [newEvent, ...currentEvents]);
    handleCloseModal();
  };

  const handleOpenModal = () => {
    // open clean modal (no suggested text)
    setNewGroupName('');
    setNewComments('');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setNewGroupName('');
    setNewComments('');
  };

  const handleDeleteEvent = (id) => {
    setEvents(currentEvents => currentEvents.filter(e => e.id !== id));
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" />

      {/* NEW EVENT MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={globalStyles.modalOverlay}>

          <View style={homeStyles.modalContainer}>
            <TextInput
              style={homeStyles.modalInput}
              placeholder="Group name..."
              placeholderTextColor={colors.text}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <View style={homeStyles.participantsRow}>
              <FontAwesome5 name="users" size={24} color={colors.text} />
              <TouchableOpacity style={homeStyles.participantButton}>
                <Text style={homeStyles.participantButtonText}>Me</Text>
              </TouchableOpacity>
              <TouchableOpacity style={homeStyles.participantAddButton}>
                <FontAwesome5 name="plus" size={32} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={homeStyles.modalCommentLabel}>Comments</Text>
            <TextInput
              style={homeStyles.commentsInput}
              placeholder="Tell us a bit about this gathering..."
              placeholderTextColor={colors.text}
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
        <TouchableOpacity style={homeStyles.addButton} onPress={handleOpenModal}>
          <Ionicons name="add" size={30} color="white" />
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
                <FontAwesome5 name="times" size={12} color="white" />
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

// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StatusBar,
//   Modal,
//   TextInput
// } from 'react-native';
// import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import { eventsData } from './data/homeScreenData.js';
// import { globalStyles, colors } from './styles/styles.js'; 
// import { homeStyles } from './styles/homeStyles.js'; 


// export default function HomeScreen({ navigation }) {

//   const [events, setEvents] = useState(eventsData);
//   // Set initial state to the suggested values for the 'Hotpot' modal
//   const [newGroupName, setNewGroupName] = useState('Hotpot'); 
//   const [newComments, setNewComments] = useState('Group of 5 celebrating NYE');
//   const [modalVisible, setModalVisible] = useState(false);
//   // NEW: State to control if the "Suggested" text should appear
//   const [isSuggested, setIsSuggested] = useState(false); 

//   // --- REMOVED useFonts HOOK & Loading Check --- 

//   const handlePress = (eventTitle) => {
//     navigation.navigate('EventDetail', { eventTitle: eventTitle });
//   };

//   const handleAddNewGroup = () => {
//     if (newGroupName.trim() === '') return;
//     const newEvent = {
//       id: Date.now(),
//       title: newGroupName,
//       icon: null,
//       library: null,
//     };
//     setEvents(currentEvents => [newEvent, ...currentEvents]);
//     handleCloseModal();
//   };

//   const handleOpenModal = () => {
//     // Set the state to the suggested text when opening
//     setNewGroupName('Hotpot'); 
//     setNewComments('Group of 5 celebrating NYE');
//     setIsSuggested(true); // Activate the suggested text flag
//     setModalVisible(true);
//   }

//   const handleCloseModal = () => {
//     setModalVisible(false);
//     // Reset state after closing
//     setNewGroupName(''); 
//     setNewComments('');
//     setIsSuggested(false);
//   }

//   return (
//     <SafeAreaView style={globalStyles.container}>
//       <StatusBar barStyle="dark-content" />

//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={handleCloseModal}
//       >
//         <View style={globalStyles.modalOverlay}>
          
//           {/* CONDITIONALLY RENDER THE SUGGESTION TEXT */}
//           {isSuggested && (
//             // This view helps align the text correctly relative to the modal
//             <View style={{ width: '90%', alignSelf: 'center' }}>
//               <Text style={homeStyles.suggestedText}>Grabbit suggested:</Text>
//             </View>
//           )}

//           <View style={homeStyles.modalContainer}>
            
//             {/* The second image does not have the "Group Name" label above the input */}
//             <TextInput
//               style={homeStyles.modalInput}
//               // placeholder="Enter group name..." // No placeholder needed if value is set
//               placeholderTextColor={colors.text}
//               value={newGroupName}
//               onChangeText={setNewGroupName}
//             />

//             <View style={homeStyles.participantsRow}>
//               <FontAwesome5 name="users" size={24} color={colors.text} />
//               <TouchableOpacity style={homeStyles.participantButton}>
//                 <Text style={homeStyles.participantButtonText}>Me</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={homeStyles.participantAddButton}>
//                 <FontAwesome5 name="plus" size={32} color={colors.text} />
//               </TouchableOpacity>
//             </View>

//             <Text style={homeStyles.modalCommentLabel}>Comments</Text>
//             <TextInput
//               style={homeStyles.commentsInput}
//               // placeholder="Tell us a bit about this gathering..." // No placeholder needed if value is set
//               placeholderTextColor={colors.text}
//               multiline={true}
//               numberOfLines={4}
//               value={newComments}
//               onChangeText={setNewComments}
//             />

//             <View style={homeStyles.modalButtonRow}>
//               <TouchableOpacity
//                 style={[homeStyles.modalActionButton, homeStyles.closeButton]}
//                 onPress={handleCloseModal}
//               >
//                 <FontAwesome5 name="times" size={24} color="white" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[homeStyles.modalActionButton, homeStyles.confirmButton]}
//                 onPress={handleAddNewGroup}
//               >
//                 <FontAwesome5 name="check" size={24} color="white" />
//               </TouchableOpacity>
//             </View>

//           </View>
//         </View>
//       </Modal>
      
//       <View style={homeStyles.header}>
//         <Text style={homeStyles.headerTitle}>Grabbit.</Text>
//         {/* Call the new handleOpenModal function */}
//         <TouchableOpacity style={homeStyles.addButton} onPress={handleOpenModal}>
//           <Ionicons name="add" size={30} color="white" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView contentContainerStyle={homeStyles.scrollContent}>
//         <View style={homeStyles.grid}>
//           {events.map((item) => (
//             <TouchableOpacity 
//               key={item.id} 
//               style={homeStyles.card} 
//               onPress={() => handlePress(item.title)}
//             >
//               <Text style={homeStyles.cardTitle}>{item.title}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }