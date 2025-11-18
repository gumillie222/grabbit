import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { globalStyles, colors } from './styles/styles.js';
import { detailStyles } from './styles/eventDetailStyles.js';

export default function EventDetailScreen({ route, navigation }) {
  const { eventTitle } = route.params || { eventTitle: "Unit 602" };

  const [activeTab, setActiveTab] = useState('List'); 
  const [newItemText, setNewItemText] = useState('');
  
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [priceInput, setPriceInput] = useState('');

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
    setBuyModalVisible(false);
    setPriceInput('');
  };

  const renderListTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView style={detailStyles.listContainer}>
        {items.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={detailStyles.listItemRow}
            onPress={() => openBuyModal(item)}
          >
            <View style={[detailStyles.checkbox, item.bought && detailStyles.checkboxChecked]} />
            {/* Fonts are now in detailStyles.listItemText */}
            <Text style={detailStyles.listItemText}>
              {item.name}
            </Text>
            <View style={detailStyles.iconGroup}>
              {item.urgent && (
                 <View style={detailStyles.urgentIcon}>
                   <Text style={detailStyles.exclamation}>!</Text>
                 </View>
              )}
              {item.claimedBy === 'Me' ? (
                <View style={detailStyles.avatarSmall}>
                  <Text style={detailStyles.avatarTextSmall}>Me</Text>
                </View>
              ) : (
                 <View style={detailStyles.dashedCircle} />
              )}
            </View>
          </TouchableOpacity>
        ))}

        <View style={detailStyles.addItemRow}>
           <View style={detailStyles.checkboxPlaceholder} />
           <TextInput
              style={detailStyles.newItemInput}
              placeholder="New Item..."
              placeholderTextColor={colors.modalPlaceholder} 
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAddItem}
           />
        </View>

        <TouchableOpacity style={detailStyles.recentlyBoughtLink}>
            <Text style={detailStyles.linkText}>Recently Bought</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSplitTab = () => (
    <View style={detailStyles.splitCenterContainer}>
       <View style={detailStyles.splitRow}>
          <View style={detailStyles.avatarMedium}>
            <Text style={detailStyles.avatarTextMedium}>A</Text>
          </View>
          <View style={detailStyles.arrowContainer}>
             <Text style={detailStyles.amountText}>$1.44</Text>
             <View style={detailStyles.arrowLine} />
             <View style={detailStyles.arrowHead} />
          </View>
          <View style={detailStyles.avatarMedium}>
            <Text style={detailStyles.avatarTextMedium}>Me</Text>
          </View>
       </View>
       <TouchableOpacity style={detailStyles.settleButton}>
         <Text style={detailStyles.settleButtonText}>Settle</Text>
       </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      
      <View style={detailStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={detailStyles.backButton}>
          <FontAwesome5 name="angle-double-left" size={24} color={colors.color6} />
        </TouchableOpacity>
      </View>

      <View style={detailStyles.titleContainer}>
         <Text style={detailStyles.titleText}>{eventTitle}</Text>
         <Text style={detailStyles.subTitleText}>Roommates!</Text>
      </View>

      <View style={detailStyles.participantsRow}>
        <FontAwesome5 name="users" size={16} color={colors.text} style={{marginRight: 8}} />
        <View style={detailStyles.avatarSmallSelected}><Text style={detailStyles.avatarTextSmall}>Me</Text></View>
        <View style={detailStyles.avatarSmall}><Text style={detailStyles.avatarTextSmall}>A</Text></View>
        <TouchableOpacity style={detailStyles.addParticipant}>
            <FontAwesome5 name="plus" size={10} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={detailStyles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('List')}>
          <Text style={[
            detailStyles.tabText, 
            activeTab === 'List' ? detailStyles.tabActive : detailStyles.tabInactive
          ]}>
            The List.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('Split')} style={{marginLeft: 20}}>
          <Text style={[
            detailStyles.tabText, 
            activeTab === 'Split' ? detailStyles.tabActive : detailStyles.tabInactive
          ]}>
            The Split.
          </Text>
        </TouchableOpacity>
      </View>
      <View style={detailStyles.divider} />

      {activeTab === 'List' ? renderListTab() : renderSplitTab()}

      <Modal
        animationType="fade"
        transparent={true}
        visible={buyModalVisible}
        onRequestClose={() => setBuyModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={globalStyles.modalOverlay} 
        >
          <View style={detailStyles.modalContainer}> 
             <Text style={detailStyles.modalTitle}>
               Buying: {selectedItem?.name}
             </Text>
             
             <View style={detailStyles.priceInputRow}>
               <Text style={detailStyles.currencySymbol}>$</Text>
               <TextInput 
                 style={detailStyles.priceInput}
                 placeholder="0.00"
                 keyboardType="numeric"
                 value={priceInput}
                 onChangeText={setPriceInput}
                 autoFocus={true}
                 placeholderTextColor={colors.modalPlaceholder}
               />
             </View>

             <Text style={detailStyles.sharedByLabel}>shared by</Text>
             
             <View style={detailStyles.sharedByRow}>
               <View style={[detailStyles.avatarSmallSelected, {marginRight:5}]}><Text style={detailStyles.avatarTextSmall}>Me</Text></View>
               <View style={detailStyles.avatarSmall}><Text style={detailStyles.avatarTextSmall}>A</Text></View>
             </View>

             <View style={detailStyles.modalActionRow}>
                <TouchableOpacity onPress={() => setBuyModalVisible(false)} style={detailStyles.modalCloseBtn}>
                   <FontAwesome5 name="times" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBuyConfirm} style={detailStyles.modalCheckBtn}>
                   <FontAwesome5 name="check" size={16} color="#fff" />
                </TouchableOpacity>
             </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}