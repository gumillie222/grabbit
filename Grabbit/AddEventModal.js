import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { globalStyles, colors } from './styles/styles.js';
import { homeStyles } from './styles/homeStyles.js';

// Determine the correct BASE_URL based on platform
// For physical devices, you may need to use your Mac's local IP (e.g., http://10.102.227.218:4000)
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:4000';
  } else if (Platform.OS === 'ios') {
    // iOS Simulator uses localhost, physical device needs Mac's IP
    // If localhost doesn't work on physical device, replace with your Mac's IP
    return __DEV__ ? 'http://localhost:4000' : 'http://10.102.227.218:4000';
  } else if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2, physical device needs Mac's IP
    return __DEV__ ? 'http://10.0.2.2:4000' : 'http://10.102.227.218:4000';
  }
  return 'http://localhost:4000';
};

const BASE_URL = getBaseUrl();

export default function AddEventModal({ visible, onClose, onAddEvent, navigation }) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newComments, setNewComments] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setNewGroupName('');
      setNewComments('');
      setAiSuggestions([]);
      setIsLoadingSuggestions(false);
      setSelectedItems([]);
    }
  }, [visible]);

  // Fetch AI suggestions when user inputs group name or comments
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Only fetch if user has entered some text
      if ((newGroupName.trim().length > 0 || newComments.trim().length > 0)) {
        setIsLoadingSuggestions(true);
        
        // Debounce API call
        const timeoutId = setTimeout(async () => {
          try {
            const description = `${newGroupName} ${newComments}`.trim();
            const url = `${BASE_URL}/api/suggestions`;
            
            console.log(`[AddEventModal] Fetching suggestions from: ${url}`);
            console.log(`[AddEventModal] Platform: ${Platform.OS}, Description: "${description.substring(0, 50)}..."`);
            
            const res = await fetch(url, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                description,
                pastItems: [],
              }),
            });

            console.log(`[AddEventModal] Response status: ${res.status}`);

            if (!res.ok) {
              const errorText = await res.text();
              console.error(`[AddEventModal] HTTP error! status: ${res.status}, body: ${errorText}`);
              throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json(); // { suggestions: string[] }
            console.log(`[AddEventModal] Received ${data.suggestions?.length || 0} suggestions`);
            
            // Map string array to objects with id and name
            const mappedSuggestions = (data.suggestions || []).map((name, idx) => ({
              id: `ai-${Date.now()}-${idx}`,
              name,
            }));

            setAiSuggestions(mappedSuggestions);
          } catch (error) {
            console.error('[AddEventModal] Error fetching suggestions:', error);
            console.error('[AddEventModal] Error message:', error.message);
            console.error('[AddEventModal] BASE_URL was:', BASE_URL);
            console.error('[AddEventModal] Platform:', Platform.OS);
            
            // Don't clear suggestions on error - keep previous ones if any
            // setAiSuggestions([]);
          } finally {
            setIsLoadingSuggestions(false);
          }
        }, 800); // 800ms debounce

        return () => clearTimeout(timeoutId);
      } else {
        setAiSuggestions([]);
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [newGroupName, newComments]);

  const handleSelectSuggestion = (item) => {
    // Toggle item selection
    setSelectedItems(currentSelected => {
      const isSelected = currentSelected.some(selected => selected.id === item.id);
      if (isSelected) {
        // Remove if already selected
        return currentSelected.filter(selected => selected.id !== item.id);
      } else {
        // Add if not selected
        return [...currentSelected, item];
      }
    });
  };

  const handleAddNewGroup = () => {
    if (newGroupName.trim() === '') return;
    
    // Navigate to EventDetail with selected items
    navigation.navigate('EventDetail', { 
      eventTitle: newGroupName,
      isNew: true,
      initialItems: selectedItems.map((item, index) => ({
        id: Date.now() + index,
        name: item.name,
        urgent: false,
        claimedBy: null,
        bought: false,
        price: null
      }))
    });
    
    // Call the callback to add event to the list
    onAddEvent({
      id: Date.now(),
      title: newGroupName,
      icon: null,
      library: null,
      isNew: true,
    });
    
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={homeStyles.modalOverlayContainer}>
        <View style={[
          globalStyles.modalOverlay,
          (isLoadingSuggestions || aiSuggestions.length > 0) && homeStyles.modalOverlayWithSuggestions
        ]}>
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
              placeholderTextColor={colors.placeholder}
              multiline={true}
              numberOfLines={4}
              value={newComments}
              onChangeText={setNewComments}
            />

            <View style={homeStyles.modalButtonRow}>
              <TouchableOpacity
                style={[homeStyles.modalActionButton, homeStyles.closeButton]}
                onPress={onClose}
              >
                <FontAwesome5 name="times" size={24} color={colors.background}/>
              </TouchableOpacity>
              <TouchableOpacity
                style={[homeStyles.modalActionButton, homeStyles.confirmButton]}
                onPress={handleAddNewGroup}
              >
                <FontAwesome5 name="check" size={24} color={colors.background} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* AI Suggestions Section - Below Modal on Clear Screen */}
        {(isLoadingSuggestions || aiSuggestions.length > 0) && (
          <View style={homeStyles.suggestionsOuterContainer}>
            <View style={homeStyles.suggestionsHeader}>
              <FontAwesome5 name="magic" size={16} color={colors.accent} />
              <Text style={homeStyles.suggestionsHeaderText}>
                {isLoadingSuggestions ? 'Generating suggestions...' : 'Grabbit Suggests:'}
              </Text>
            </View>
            
            {isLoadingSuggestions ? (
              <View style={homeStyles.loadingContainer}>
                <Text style={homeStyles.loadingText}>Thinking...</Text>
              </View>
            ) : (
              <View style={homeStyles.suggestionsGrid}>
                {aiSuggestions.map((item) => {
                  const isSelected = selectedItems.some(selected => selected.id === item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        homeStyles.suggestionItemBlock,
                        isSelected && homeStyles.suggestionItemBlockSelected
                      ]}
                      onPress={() => handleSelectSuggestion(item)}
                    >
                      <Text style={[
                        homeStyles.suggestionItemText,
                        isSelected && homeStyles.suggestionItemTextSelected
                      ]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

