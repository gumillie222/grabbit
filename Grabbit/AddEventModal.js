import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { globalStyles, colors } from './styles/styles.js';
import { homeStyles } from './styles/homeStyles.js';
import { detailStyles } from './styles/eventDetailStyles.js';

// Determine the correct BASE_URL based on platform
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:4000';
  } else if (Platform.OS === 'ios') {
    return __DEV__ ? 'http://localhost:4000' : 'http://10.102.227.218:4000';
  } else if (Platform.OS === 'android') {
    return __DEV__ ? 'http://10.0.2.2:4000' : 'http://10.102.227.218:4000';
  }
  return 'http://localhost:4000';
};

const BASE_URL = getBaseUrl();

export default function AddEventModal({
  visible,
  onClose,
  onAddEvent,
  navigation,
  onUpdateItems,
  onUpdateParticipants,
  // friends should be passed from HomeScreen/EventContext so it matches Profile
  friends = [],
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newComments, setNewComments] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isConnected, setIsConnected] = useState(null); // null = unknown, true = connected, false = offline

  // committed participants for this event
  const [selectedParticipants, setSelectedParticipants] = useState(['Me']); // always includes "Me"

  // friends picker modal + staging state
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [tempSelectedFriends, setTempSelectedFriends] = useState([]); // only friend names (no "Me")

  // optional fallback if no friends are configured yet
  const fallbackFriends = [
    { id: 'f1', name: 'Alice' },
    { id: 'f2', name: 'Bob' },
    { id: 'f3', name: 'Charlie' },
    { id: 'f4', name: 'Diana' },
    { id: 'f5', name: 'Eve' },
    { id: 'f6', name: 'Frank' },
  ];

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
      setSelectedParticipants(['Me']);
      setFriendsModalVisible(false);
      setTempSelectedFriends([]);
    }
  }, [visible]);

  // Fetch AI suggestions when user inputs group name or comments
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (newGroupName.trim().length > 0 || newComments.trim().length > 0) {
        setIsLoadingSuggestions(true);

        const timeoutId = setTimeout(async () => {
          try {
            const description = `${newGroupName} ${newComments}`.trim();
            const url = `${BASE_URL}/api/suggestions`;

            const controller = new AbortController();
            const fetchTimeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

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
              signal: controller.signal,
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
        }, 800); // debounce

        return () => clearTimeout(timeoutId);
      } else {
        setAiSuggestions([]);
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
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
    // temp state only contains friends (no "Me")
    const currentFriends = selectedParticipants.filter(
      (name) => name !== 'Me'
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
    // Commit changes: always keep "Me" plus the selected friends
    setSelectedParticipants(['Me', ...tempSelectedFriends]);
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

              {/* Show Me plus any selected friends as round avatars with single letter */}
              {selectedParticipants.map((participant, index) => (
                <View
                  key={`${participant}-${index}`}
                  style={[
                    {
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        participant === 'Me' ? '#A89F91' : '#D6CFC4',
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={detailStyles.avatarTextSmall}>
                    {participant === 'Me'
                      ? 'Me'
                      : participant.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}

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
        <View style={globalStyles.modalOverlay}>
          <View style={homeStyles.friendsModalContainer}>
            <Text style={homeStyles.friendsModalTitle}>Select Friends</Text>

            <ScrollView
              style={homeStyles.friendsListContainer}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {effectiveFriends.map((friend) => {
                const name = friend.name;
                const isSelected = tempSelectedFriends.includes(name);
                return (
                  <TouchableOpacity
                    key={friend.id ?? name}
                    style={[
                      homeStyles.friendItem,
                      isSelected && homeStyles.friendItemSelected,
                    ]}
                    onPress={() => toggleTempFriend(name)}
                  >
                    <View
                      style={[
                        homeStyles.friendCheckbox,
                        isSelected && homeStyles.friendCheckboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <FontAwesome5
                          name="check"
                          size={12}
                          color={colors.background}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          homeStyles.friendName,
                          isSelected && homeStyles.friendNameSelected,
                        ]}
                      >
                        {name}
                      </Text>
                      {/* Optional: small phone/email lines if present */}
                      {friend.phone ? (
                        <Text style={homeStyles.friendSubText}>
                          {friend.phone}
                        </Text>
                      ) : null}
                      {friend.email ? (
                        <Text style={homeStyles.friendSubText}>
                          {friend.email}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={homeStyles.friendsModalButtonRow}>
              {/* discard changes */}
              <TouchableOpacity
                style={[homeStyles.modalActionButton, homeStyles.closeButton]}
                onPress={cancelFriendsSelection}
              >
                <FontAwesome5
                  name="times"
                  size={20}
                  color={colors.background}
                />
              </TouchableOpacity>
              {/* commit changes */}
              <TouchableOpacity
                style={[homeStyles.modalActionButton, homeStyles.confirmButton]}
                onPress={confirmFriendsSelection}
              >
                <FontAwesome5
                  name="check"
                  size={20}
                  color={colors.background}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}