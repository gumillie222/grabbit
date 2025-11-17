import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

// Colors extracted from your screenshot
const theme = {
  background: '#F3EFE0', // Creamy beige
  text: '#4A4A4A',       // Dark Grey
  accent: '#D96C55',     // The reddish/orange color
  secondary: '#D1D1D1',  // Light grey for inactive
  cardBg: '#FFFBF2',
  greenCheck: '#D96C55', // Using accent for check based on image
  blueTag: '#A3B1C6',    // The greyish blue tag
  placeholder: '#C0C0C0'
};

export default function EventDetailScreen({ route, navigation }) {
  // Get the group name passed from HomeScreen
  const { eventTitle } = route.params || { eventTitle: "Unit 602" };

  const [activeTab, setActiveTab] = useState('List'); // 'List' or 'Split'
  const [newItemText, setNewItemText] = useState('');
  
  // Modal State for "Buying" an item
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [priceInput, setPriceInput] = useState('');

  // Dummy Data based on screenshot
  const [items, setItems] = useState([
    { id: 1, name: 'dish soap', urgent: true, claimedBy: 'Me', bought: false },
    { id: 2, name: 'paper towel', urgent: false, claimedBy: null, bought: false },
    { id: 3, name: 'flower', urgent: true, claimedBy: null, bought: false },
    { id: 4, name: 'milk 2%', urgent: true, claimedBy: 'Me', bought: false },
  ]);

  const handleAddItem = () => {
    if (newItemText.trim() === '') return;
    const newItem = {
      id: Date.now(),
      name: newItemText,
      urgent: false,
      claimedBy: null,
      bought: false
    };
    setItems([...items, newItem]);
    setNewItemText('');
  };

  const openBuyModal = (item) => {
    setSelectedItem(item);
    setBuyModalVisible(true);
  };

  const handleBuyConfirm = () => {
    // Logic to mark item as bought and move to history
    setBuyModalVisible(false);
    setPriceInput('');
    // In a real app, you'd update the 'items' state here to mark it as bought
  };

  // --- Sub-Component: Render The List ---
  const renderListTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.listContainer}>
        
        {/* Active Items */}
        {items.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.listItemRow}
            onPress={() => openBuyModal(item)}
          >
            {/* Checkbox area */}
            <View style={[styles.checkbox, item.bought && styles.checkboxChecked]} />
            
            {/* Item Name */}
            <Text style={[styles.listItemText, { fontFamily: 'JosefinSans_400Regular' }]}>
              {item.name}
            </Text>

            {/* Right Side Icons */}
            <View style={styles.iconGroup}>
              {/* Urgent Icon */}
              {item.urgent && (
                 <View style={styles.urgentIcon}>
                   <Text style={styles.exclamation}>!</Text>
                 </View>
              )}
              
              {/* Claimed By Avatar */}
              {item.claimedBy === 'Me' ? (
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarTextSmall}>Me</Text>
                </View>
              ) : (
                 <View style={styles.dashedCircle} />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Add New Item Input */}
        <View style={styles.addItemRow}>
           <View style={styles.checkboxPlaceholder} />
           <TextInput
              style={[styles.newItemInput, { fontFamily: 'JosefinSans_400Regular' }]}
              placeholder="New Item..."
              placeholderTextColor={theme.placeholder}
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAddItem}
           />
        </View>

        <TouchableOpacity style={styles.recentlyBoughtLink}>
            <Text style={[styles.linkText, { fontFamily: 'JosefinSans_700Bold' }]}>Recently Bought</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );

  // --- Sub-Component: Render The Split ---
  const renderSplitTab = () => (
    <View style={styles.splitCenterContainer}>
       {/* Mock Split Data based on 'The List 20' */}
       <View style={styles.splitRow}>
          <View style={styles.avatarMedium}>
            <Text style={styles.avatarTextMedium}>A</Text>
          </View>
          
          <View style={styles.arrowContainer}>
             <Text style={styles.amountText}>$1.44</Text>
             <View style={styles.arrowLine} />
             <View style={styles.arrowHead} />
          </View>

          <View style={styles.avatarMedium}>
            <Text style={styles.avatarTextMedium}>Me</Text>
          </View>
       </View>

       <TouchableOpacity style={styles.settleButton}>
         <Text style={[styles.settleButtonText, { fontFamily: 'JosefinSans_700Bold' }]}>Settle</Text>
       </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="angle-double-left" size={24} color={theme.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
         <Text style={[styles.titleText, { fontFamily: 'JosefinSans_700Bold' }]}>
            {eventTitle}
         </Text>
         <Text style={[styles.subTitleText, { fontFamily: 'JosefinSans_700Bold' }]}>
            Roommates!
         </Text>
      </View>

      {/* Participants Row */}
      <View style={styles.participantsRow}>
        <FontAwesome5 name="users" size={16} color={theme.text} style={{marginRight: 8}} />
        <View style={styles.avatarSmallSelected}><Text style={styles.avatarTextSmall}>Me</Text></View>
        <View style={styles.avatarSmall}><Text style={styles.avatarTextSmall}>A</Text></View>
        <TouchableOpacity style={styles.addParticipant}>
            <FontAwesome5 name="plus" size={10} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('List')}>
          <Text style={[
            styles.tabText, 
            activeTab === 'List' ? styles.tabActive : styles.tabInactive,
            { fontFamily: 'JosefinSans_700Bold' }
          ]}>
            The List.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('Split')} style={{marginLeft: 20}}>
          <Text style={[
            styles.tabText, 
            activeTab === 'Split' ? styles.tabActive : styles.tabInactive,
            { fontFamily: 'JosefinSans_700Bold' }
          ]}>
            The Split.
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* Main Content */}
      {activeTab === 'List' ? renderListTab() : renderSplitTab()}

      {/* --- BUY MODAL (Matches "The List 17") --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={buyModalVisible}
        onRequestClose={() => setBuyModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
             <Text style={[styles.modalTitle, { fontFamily: 'JosefinSans_700Bold' }]}>
               Buying: {selectedItem?.name}
             </Text>
             
             <View style={styles.priceInputRow}>
               <Text style={styles.currencySymbol}>$</Text>
               <TextInput 
                 style={styles.priceInput}
                 placeholder="0.00"
                 keyboardType="numeric"
                 value={priceInput}
                 onChangeText={setPriceInput}
                 autoFocus={true}
               />
             </View>

             <Text style={[styles.sharedByLabel, { fontFamily: 'JosefinSans_400Regular' }]}>shared by</Text>
             
             <View style={styles.sharedByRow}>
               <View style={[styles.avatarSmallSelected, {marginRight:5}]}><Text style={styles.avatarTextSmall}>Me</Text></View>
               <View style={styles.avatarSmall}><Text style={styles.avatarTextSmall}>A</Text></View>
             </View>

             {/* Modal Actions */}
             <View style={styles.modalActionRow}>
                <TouchableOpacity onPress={() => setBuyModalVisible(false)} style={styles.modalCloseBtn}>
                   <FontAwesome5 name="times" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBuyConfirm} style={styles.modalCheckBtn}>
                   <FontAwesome5 name="check" size={16} color="#fff" />
                </TouchableOpacity>
             </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 5,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  titleText: {
    fontSize: 24,
    color: theme.accent, // "Unit 602" color
  },
  subTitleText: {
    fontSize: 24,
    color: theme.accent,
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addParticipant: {
    marginLeft: 8,
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    marginBottom: 5,
  },
  tabText: {
    fontSize: 18,
  },
  tabActive: {
    color: theme.text,
    textDecorationLine: 'underline',
  },
  tabInactive: {
    color: theme.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
  },

  // List Items
  listContainer: {
    paddingHorizontal: 40,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    backgroundColor: '#EAE6D7',
    marginRight: 15,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.greenCheck,
  },
  checkboxPlaceholder: {
    width: 20,
    height: 20,
    marginRight: 15, // invisible spacer
  },
  listItemText: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
  },
  newItemInput: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 5
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },

  // Icons & Avatars
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgentIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  exclamation: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EAE6D7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  avatarSmallSelected: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#C5BDB0', // Darker beige for "Me"
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  avatarTextSmall: {
    fontSize: 10,
    color: theme.text,
    fontWeight: 'bold'
  },
  dashedCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.accent,
    borderStyle: 'dashed',
    marginRight: 5,
  },
  
  // Footer Links
  recentlyBoughtLink: {
    marginTop: 20,
    marginBottom: 50,
  },
  linkText: {
    color: '#5C6B73',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FDFBF6',
    padding: 25,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    color: theme.text,
    marginBottom: 15,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: theme.text,
    width: 100,
  },
  currencySymbol: {
    fontSize: 20,
    color: theme.text,
    marginRight: 5,
  },
  priceInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    width: '100%',
  },
  sharedByLabel: {
    fontSize: 12,
    color: theme.secondary,
    marginBottom: 8,
  },
  sharedByRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseBtn: {
    backgroundColor: '#5A6770',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalCheckBtn: {
    backgroundColor: theme.accent,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Split Tab
  splitCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  avatarMedium: {
    width: 40,
    height: 40,
    borderRadius: 8, // Square with rounded corners as per Split view
    backgroundColor: '#D6CFC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextMedium: {
    fontSize: 16, 
    fontWeight: 'bold', 
    color: theme.text
  },
  arrowContainer: {
    width: 100,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  amountText: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: 'bold',
    color: theme.text
  },
  arrowLine: {
    width: '100%',
    height: 1,
    backgroundColor: theme.accent,
  },
  arrowHead: {
     position: 'absolute',
     right: 0,
     bottom: -4,
     width: 0,
     height: 0,
     borderTopWidth: 4,
     borderTopColor: 'transparent',
     borderBottomWidth: 4,
     borderBottomColor: 'transparent',
     borderLeftWidth: 8,
     borderLeftColor: theme.accent,
  },
  settleButton: {
    backgroundColor: theme.accent,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  settleButtonText: {
    color: 'white',
    fontSize: 16,
  }
});