import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { globalStyles, colors } from './styles/styles.js';
import { homeStyles } from './styles/homeStyles.js';
import { detailStyles } from './styles/eventDetailStyles.js';
import { useAuth } from './AuthContext';
import { getUserColors, getUserInitial } from './userColors';
import { SERVER_URL } from './config';

// Use SERVER_URL from config for consistency
const BASE_URL = SERVER_URL;

export default function AddEventModal({
  visible,
  onClose,
  onAddEvent,
  navigation,
  onUpdateItems,
  onUpdateParticipants,
  // friends should be passed from HomeScreen/EventContext so it matches Profile
  friends = [],
  existingEvents = [],
  archivedEvents = [],
}) {
  const { currentUser } = useAuth();
  const [newGroupName, setNewGroupName] = useState('');
  const [newComments, setNewComments] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isConnected, setIsConnected] = useState(null); // null = unknown, true = connected, false = offline

  // committed participants for this event
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // friends picker modal + staging state
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [tempSelectedFriends, setTempSelectedFriends] = useState([]);

  // optional fallback if no friends are configured yet
  const fallbackFriends = [];

  // final list to display in the friend picker
  const effectiveFriends =
    friends && friends.length > 0 ? friends : fallbackFriends;

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setNewGroupName('');
      setNewComments('');
      setAiSuggestions([]);
      setIsLoadingSuggestions(false);
      setSelectedItems([]);
      setIsConnected(null);
      setSelectedParticipants(currentUser?.name ? [currentUser.name] : []);
      setFriendsModalVisible(false);
      setTempSelectedFriends([]);
    }
  }, [visible]);

  // Fetch AI suggestions when user inputs group name or comments
  useEffect(() => {
    let timeoutId = null;
    let abortController = null;

    const fetchSuggestions = async () => {
      const description = `${newGroupName} ${newComments}`.trim();
      
      if (description.length === 0) {
        setAiSuggestions([]);
        setIsLoadingSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);

      // Cancel any previous request
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();

      timeoutId = setTimeout(async () => {
        try {
          const url = `${BASE_URL}/api/suggestions`;
          const fetchTimeout = setTimeout(() => abortController.abort(), 5000); // 5s timeout

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              description,
              pastItems: [],
            }),
            signal: abortController.signal,
          });

          clearTimeout(fetchTimeout);

          if (!res.ok) {
            throw new Error('Server error');
          }

          const data = await res.json(); // { suggestions: string[] }

          const mappedSuggestions = (data.suggestions || []).map(
            (name, idx) => ({
              id: `ai-${Date.now()}-${idx}`,
              name,
            })
          );

          setAiSuggestions(mappedSuggestions);
          setIsConnected(true);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.log(
              '[AddEventModal] Using fallback items (connection unavailable)'
            );
          }

          setIsConnected(false);

          const fallbackItems = [
            { id: 'fallback-1', name: 'Milk' },
            { id: 'fallback-2', name: 'Bread' },
            { id: 'fallback-3', name: 'Eggs' },
            { id: 'fallback-4', name: 'Butter' },
            { id: 'fallback-5', name: 'Cheese' },
            { id: 'fallback-6', name: 'Chicken' },
            { id: 'fallback-7', name: 'Rice' },
            { id: 'fallback-8', name: 'Pasta' },
            { id: 'fallback-9', name: 'Tomatoes' },
            { id: 'fallback-10', name: 'Onions' },
            { id: 'fallback-11', name: 'Bananas' },
            { id: 'fallback-12', name: 'Yogurt' },
          ];

          setAiSuggestions(fallbackItems);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 1500); // Debounce to 1.5 seconds
    };

    fetchSuggestions();

    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (abortController) {
        abortController.abort();
      }
    };
  }, [newGroupName, newComments]);

  const handleSelectSuggestion = (item) => {
    setSelectedItems((currentSelected) => {
      const isSelected = currentSelected.some(
        (selected) => selected.id === item.id
      );
      if (isSelected) {
        return currentSelected.filter((selected) => selected.id !== item.id);
      } else {
        return [...currentSelected, item];
      }
    });
  };

  const handleAddNewGroup = () => {
    if (newGroupName.trim() === '') return;

    // Check for duplicate event names (case-insensitive)
    const trimmedName = newGroupName.trim();
    const allEvents = [...existingEvents, ...archivedEvents];
    const duplicateEvent = allEvents.find(
      event => event.title && event.title.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateEvent) {
      Alert.alert(
        'Duplicate Event Name',
        `An event with the name "${trimmedName}" already exists. Please choose a different name.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const newEventId = Date.now();
    const initialItems = selectedItems.map((item, index) => ({
      id: Date.now() + index,
      name: item.name,
      urgent: false,
      claimedBy: null,
      bought: false,
      price: null,
    }));

    onAddEvent({
      id: newEventId,
      title: newGroupName,
      icon: null,
      library: null,
      isNew: true,
      items: initialItems,
      participants: selectedParticipants,
    });

    navigation.navigate('EventDetail', {
      eventId: newEventId,
      eventTitle: newGroupName,
      isNew: true,
      initialItems: initialItems,
      participants: selectedParticipants,
      onUpdateItems: onUpdateItems,
      onUpdateParticipants: onUpdateParticipants,
    });

    onClose();
  };

  // ----- Friends modal helpers -----

  const openFriendsModal = () => {
    // temp state only contains friends (no current user)
    const currentFriends = selectedParticipants.filter(
      (name) => name !== currentUser?.name
    );
    setTempSelectedFriends(currentFriends);
    setFriendsModalVisible(true);
  };

  const toggleTempFriend = (friendName) => {
    setTempSelectedFriends((prev) =>
      prev.includes(friendName)
        ? prev.filter((f) => f !== friendName)
        : [...prev, friendName]
    );
  };

  const cancelFriendsSelection = () => {
    // Do NOT touch selectedParticipants, just close
    setFriendsModalVisible(false);
    setTempSelectedFriends([]);
  };

  const confirmFriendsSelection = () => {
    // Commit changes: always keep current user plus the selected friends
    const newParticipants = [currentUser?.name, ...tempSelectedFriends].filter(Boolean);
    setSelectedParticipants(newParticipants);
    setFriendsModalVisible(false);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={homeStyles.modalOverlayContainer}>
        <View
          style={[
            globalStyles.modalOverlay,
            (isLoadingSuggestions || aiSuggestions.length > 0) &&
              homeStyles.modalOverlayWithSuggestions,
          ]}
        >
          <View style={homeStyles.modalContainer}>
            <TextInput
              style={homeStyles.modalInput}
              placeholder="Group name..."
              placeholderTextColor={colors.text}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            {/* Participants row */}
            <View style={[homeStyles.participantsRow, { marginBottom: 16 }]}>
              {/* Make the icon its own "chip" so it lines up nicely */}
              <View style={homeStyles.participantIconCircle}>
                <FontAwesome5 name="users" size={18} color={colors.text} />
              </View>

              {/* Show current user plus any selected friends as round avatars with single letter */}
              {selectedParticipants.map((participant, index) => {
                // Find the user ID for this participant (could be name or ID)
                let participantId = participant;
                if (participant === currentUser?.name) {
                  participantId = currentUser?.id;
                } else {
                  // Try to find friend by name
                  const friend = friends.find(f => f.name === participant);
                  if (friend) participantId = friend.id;
                }
                const userColors = getUserColors(participantId);
                return (
                  <View
                    key={`${participant}-${index}`}
                    style={[
                      {
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: userColors.backgroundColor,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <Text style={[detailStyles.avatarTextSmall, { color: userColors.textColor }]}>
                      {getUserInitial(participantId, participant)}
                    </Text>
                  </View>
                );
              })}

              {/* Plus chip – same size as participant chips */}
              <TouchableOpacity
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#D6CFC4',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={openFriendsModal}
              >
                <FontAwesome5 name="plus" size={14} color={colors.text} />
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
                <FontAwesome5
                  name="times"
                  size={24}
                  color={colors.background}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[homeStyles.modalActionButton, homeStyles.confirmButton]}
                onPress={handleAddNewGroup}
              >
                <FontAwesome5
                  name="check"
                  size={24}
                  color={colors.background}
                />
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
                {isLoadingSuggestions
                  ? 'Generating suggestions...'
                  : 'Grabbit Suggests:'}
              </Text>
              {!isLoadingSuggestions && isConnected !== null && (
                <FontAwesome5
                  name={isConnected ? 'check-circle' : 'times-circle'}
                  size={16}
                  color={isConnected ? '#4CAF50' : '#F44336'}
                  style={homeStyles.connectionIndicatorIcon}
                />
              )}
            </View>

            {isLoadingSuggestions ? (
              <View style={homeStyles.loadingContainer}>
                <Text style={homeStyles.loadingText}>Thinking...</Text>
              </View>
            ) : (
              <ScrollView
                style={homeStyles.suggestionsScrollView}
                contentContainerStyle={homeStyles.suggestionsGrid}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {aiSuggestions.map((item) => {
                  const isSelected = selectedItems.some(
                    (selected) => selected.id === item.id
                  );
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        homeStyles.suggestionItemBlock,
                        isSelected && homeStyles.suggestionItemBlockSelected,
                      ]}
                      onPress={() => handleSelectSuggestion(item)}
                    >
                      <Text
                        style={[
                          homeStyles.suggestionItemText,
                          isSelected &&
                            homeStyles.suggestionItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Friends Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={friendsModalVisible}
        onRequestClose={cancelFriendsSelection}
      >
        <TouchableWithoutFeedback onPress={cancelFriendsSelection}>
          <View style={globalStyles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={detailStyles.friendsModalContainer}>
                <Text style={detailStyles.friendsModalTitle}>Select Friends</Text>

                <ScrollView
                  style={detailStyles.friendsListContainer}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {effectiveFriends.map((friend) => {
                    const name = friend.name;
                    const isSelected = tempSelectedFriends.includes(name);
                    return (
                      <TouchableOpacity
                        key={friend.id ?? name}
                        style={[
                          detailStyles.friendItem,
                          isSelected && detailStyles.friendItemSelected,
                        ]}
                        onPress={() => toggleTempFriend(name)}
                      >
                        <View
                          style={[
                            detailStyles.friendCheckbox,
                            isSelected && detailStyles.friendCheckboxSelected,
                          ]}
                        >
                          {isSelected && (
                            <FontAwesome5
                              name="check"
                              size={10}
                              color={colors.background}
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            detailStyles.friendName,
                            isSelected && detailStyles.friendNameSelected,
                          ]}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={detailStyles.friendsModalButtonRow}>
                  <TouchableOpacity
                    style={detailStyles.modalCloseBtn}
                    onPress={cancelFriendsSelection}
                  >
                    <FontAwesome5 name="times" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={detailStyles.modalCheckBtn}
                    onPress={confirmFriendsSelection}
                  >
                    <FontAwesome5 name="check" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );
}