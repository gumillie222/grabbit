import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { io } from 'socket.io-client';

import { profileStyles } from './styles/profileStyles';
import { globalStyles, colors } from './styles/styles';
import { EventContext } from './EventContext';
import { useAuth } from './AuthContext';
import { api } from './api';
import { SERVER_URL } from './config';

export default function ProfileScreen({ navigation }) {
  const { archivedEvents, unarchiveEvent, friends, setFriends } = useContext(EventContext);
  const { currentUser, switchAccount, updateUser } = useAuth();
  const socketRef = useRef(null);
  
  const [profile, setProfile] = useState({
    name: currentUser?.name || 'Grab Bit',
    phone: currentUser?.phone || '508-667-1234',
    email: currentUser?.email || 'grabbit@upenn.edu',
  });

  // Sync profile with currentUser when it changes
  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.name || 'Grab Bit',
        phone: currentUser.phone || '508-667-1234',
        email: currentUser.email || 'grabbit@upenn.edu',
      });
    }
  }, [currentUser]);

  const [editVisible, setEditVisible] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftPhone, setDraftPhone] = useState(profile.phone);
  const [draftEmail, setDraftEmail] = useState(profile.email);

  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'archive'

  // used in the "add friend" modal
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendPhone, setNewFriendPhone] = useState('');
  const [newFriendEmail, setNewFriendEmail] = useState('');

  // Friend requests from backend
  const [friendRequests, setFriendRequests] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // --- Archived event detail modal state ---
  const [selectedArchivedEvent, setSelectedArchivedEvent] = useState(null);
  const [archiveDetailVisible, setArchiveDetailVisible] = useState(false);

  // --- Friend modal state ---
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [friendTab, setFriendTab] = useState('add'); // 'add' | 'requests'
  const [settingsVisible, setSettingsVisible] = useState(false);

  const openEdit = () => {
    setDraftName(profile.name);
    setDraftPhone(profile.phone);
    setDraftEmail(profile.email);
    setEditVisible(true);
  };

  // Load friends and friend requests on mount
  useEffect(() => {
    if (currentUser?.id) {
      loadFriends();
      loadFriendRequests();
      setupSocket();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser?.id]);

  const setupSocket = () => {
    if (!currentUser?.id) return;
    
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      query: { userId: currentUser.id },
    });
    socketRef.current = socket;

    socket.on('friend:request', (payload) => {
      loadFriendRequests(); // Reload requests when new one arrives
    });

    socket.on('friend:accepted', (payload) => {
      loadFriends(); // Reload friends when request is accepted
      loadFriendRequests(); // Reload requests to remove accepted one
    });

    socket.on('friend:declined', (payload) => {
      loadFriendRequests(); // Reload requests when declined
    });
  };

  const loadFriends = async () => {
    if (!currentUser?.id) return;
    try {
      setLoadingFriends(true);
      
      // Hardcode friends based on user name
      const userName = currentUser.name?.toLowerCase();
      let hardcodedFriends = [];
      
      if (userName === 'bob') {
        // Bob has only Alice as a friend
        hardcodedFriends = [
          { id: 'alice', name: 'Alice', phone: '555-111-2222', email: 'alice@example.com' },
        ];
      } else if (userName === 'alice') {
        // Alice has only Bob as a friend
        hardcodedFriends = [
          { id: 'bob', name: 'Bob', phone: '555-333-4444', email: 'bob@example.com' },
        ];
      } else {
        // For other users, try to load from backend
        const response = await api.getFriends(currentUser.id);
        hardcodedFriends = response.friends || [];
      }
      
      setFriends(hardcodedFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadFriendRequests = async () => {
    if (!currentUser?.id) return;
    try {
      const response = await api.getFriendRequests(currentUser.id);
      // Format received requests for display
      const formatted = (response.received || []).map(req => ({
        id: req.id,
        name: req.fromUser?.name || 'Unknown',
        contact: req.fromUser?.email || req.fromUser?.phone || '',
        fromUser: req.fromUser,
        fromUserId: req.fromUserId,
      }));
      setFriendRequests(formatted);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const saveEdits = async () => {
    const updated = {
      name: draftName.trim() || profile.name,
      phone: draftPhone.trim() || profile.phone,
      email: draftEmail.trim() || profile.email,
    };
    setProfile(updated);
    if (currentUser) {
      await updateUser(updated);
    }
    setEditVisible(false);
  };

  const handleSendFriendRequest = async () => {
    if (!newFriendPhone.trim() && !newFriendEmail.trim()) {
      Alert.alert('Missing info', 'Please enter a phone number or email.');
      return;
    }

    if (!currentUser?.id) {
      Alert.alert('Error', 'You must be logged in to send friend requests.');
      return;
    }

    try {
      // First, search for the user
      const searchResult = await api.searchUsers(
        newFriendEmail.trim() || undefined,
        newFriendPhone.trim() || undefined
      );

      if (!searchResult.users || searchResult.users.length === 0) {
        Alert.alert('User not found', 'No user found with that email or phone number.');
        return;
      }

      const targetUser = searchResult.users[0];
      if (targetUser.id === currentUser.id) {
        Alert.alert('Error', 'You cannot send a friend request to yourself.');
        return;
      }

      // Send friend request
      await api.sendFriendRequest(currentUser.id, targetUser.id);
      Alert.alert('Request sent', 'Your friend request has been sent!');
      setNewFriendName('');
      setNewFriendPhone('');
      setNewFriendEmail('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send friend request.');
    }
  };

  const handleAcceptRequest = async (request) => {
    if (!currentUser?.id) return;
    
    try {
      await api.acceptFriendRequest(request.id, currentUser.id);
      // Friends and requests will be reloaded via socket event
      Alert.alert('Success', `You are now friends with ${request.name}!`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to accept friend request.');
    }
  };

  const handleDeclineRequest = async (request) => {
    if (!currentUser?.id) return;
    
    try {
      await api.declineFriendRequest(request.id, currentUser.id);
      // Requests will be reloaded via socket event
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to decline friend request.');
    }
  };

  const handleOpenFriendModal = () => {
    setFriendTab('add');
    setFriendModalVisible(true);
  };

  const handleOpenArchivedEvent = (event) => {
    setSelectedArchivedEvent(event);
    setArchiveDetailVisible(true);
  };

  const closeArchiveDetail = () => {
    setArchiveDetailVisible(false);
    setSelectedArchivedEvent(null);
  };

  const renderFriendsTab = () => (
    <View style={{ flex: 1 }}>
      <View style={profileStyles.sectionCard}>
        {/* Row to open friend modal */}
        <TouchableOpacity
          style={profileStyles.addFriendRow}
          onPress={handleOpenFriendModal}
        >
          <View style={profileStyles.addFriendIconCircle}>
            <FontAwesome5 name="user-plus" size={13} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={profileStyles.addFriendTitle}>Add or manage friends</Text>
            <Text style={profileStyles.addFriendSubtitle}>
              Send new requests or review invites
            </Text>
          </View>
        </TouchableOpacity>

        {/* Friend list */}
        {friends.length === 0 ? (
          <Text style={profileStyles.emptyText}>
            No friends yet. Add someone above!
          </Text>
        ) : (
          friends.map(friend => (
            <View key={friend.id} style={profileStyles.friendRow}>
              <View style={profileStyles.friendAvatar}>
                <Text style={profileStyles.friendAvatarText}>
                  {friend.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={profileStyles.friendName}>{friend.name}</Text>
                {friend.phone ? (
                  <Text style={profileStyles.friendSubText}>{friend.phone}</Text>
                ) : null}
                {friend.email ? (
                  <Text style={profileStyles.friendSubText}>{friend.email}</Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );

  const renderArchiveTab = () => (
    <View style={{ flex: 1 }}>
      <View style={profileStyles.sectionCard}>
        {archivedEvents.length === 0 ? (
          <Text style={profileStyles.emptyText}>
            Nothing archived yet. Tap the archive icon on a card to send it here.
          </Text>
        ) : (
          archivedEvents.map(event => (
            <View key={event.id} style={profileStyles.archiveCardWrapper}>
              {/* Unarchive badge */}
              <TouchableOpacity
                style={profileStyles.unarchiveBadge}
                onPress={() => unarchiveEvent(event.id)}
              >
                <FontAwesome5 name="undo" size={10} color="#fff" />
              </TouchableOpacity>

              {/* Open read-only detail modal */}
              <TouchableOpacity
                style={profileStyles.archiveCard}
                onPress={() => handleOpenArchivedEvent(event)}
              >
                <Text style={profileStyles.archiveTitle}>{event.title}</Text>
                <Text style={profileStyles.archiveSubtitle}>
                  {event.items?.length || 0} items ·{' '}
                  {(event.participants || ['Me']).length} people
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={profileStyles.profileContainer}>
        {/* Top Icons */}
        <View style={profileStyles.topIcons}>
          <TouchableOpacity style={profileStyles.iconButton} onPress={openEdit}>
            <FontAwesome5 name="edit" size={20} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={profileStyles.iconButton}
            onPress={() => setSettingsVisible(true)}
          >
            <FontAwesome5 name="cog" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={profileStyles.avatarLarge}>
          <Text style={profileStyles.avatarTextLarge}>
            {profile.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* User Info – using the larger base sizes from profileStyles */}
        <Text style={profileStyles.userName}>{profile.name}</Text>
        <Text style={profileStyles.userInfoText}>{profile.phone}</Text>
        <Text style={profileStyles.userInfoText}>{profile.email}</Text>

        {/* Tabs + content */}
        <View style={{ flex: 1, width: '100%', marginTop: 32 }}>
          {/* Tab buttons */}
          <View style={profileStyles.tabRow}>
            <TouchableOpacity
              style={[
                profileStyles.tabButton,
                activeTab === 'friends' && profileStyles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('friends')}
            >
              <Text
                style={[
                  profileStyles.tabText,
                  activeTab === 'friends' && profileStyles.tabTextActive,
                ]}
              >
                Friends
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                profileStyles.tabButton,
                activeTab === 'archive' && profileStyles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('archive')}
            >
              <Text
                style={[
                  profileStyles.tabText,
                  activeTab === 'archive' && profileStyles.tabTextActive,
                ]}
              >
                Event Archive
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'friends' ? renderFriendsTab() : renderArchiveTab()}
          </ScrollView>
        </View>
      </View>

      {/* Settings / About modal */}
      <Modal
        animationType="fade"
        transparent
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={profileStyles.settingsContainer}>
            <View style={profileStyles.settingsHeader}>
              <Text style={profileStyles.settingsTitle}>About Grabbit</Text>
              <TouchableOpacity 
                onPress={() => setSettingsVisible(false)}
                style={{ marginRight: -8, marginTop: -8 }}
              >
                <FontAwesome5 name="times" size={18} color="#e55347" />
              </TouchableOpacity>
            </View>

            <Text style={profileStyles.settingsSubtitle}>What this app does</Text>
            <Text style={profileStyles.settingsBody}>
              Grabbit helps small groups keep track of shared items, see who is buying what, and split costs fairly.
            </Text>

            <Text style={profileStyles.settingsSubtitle}>Quick how-to</Text>
            <View style={profileStyles.settingsList}>
              <Text style={profileStyles.settingsBullet}>• Create an event on Home.</Text>
              <Text style={profileStyles.settingsBullet}>• Add friends, then add items to the list.</Text>
              <Text style={profileStyles.settingsBullet}>• Check items when bought and enter prices.</Text>
              <Text style={profileStyles.settingsBullet}>• Use "The Split" tab to see who owes what.</Text>
            </View>

            <View style={{ alignItems: 'center', marginTop: 8, width: '100%' }}>
              <TouchableOpacity
                style={[profileStyles.friendModalPrimaryButton, { alignSelf: 'center' }]}
                onPress={async () => {
                  await switchAccount();
                  setSettingsVisible(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome5 name="exchange-alt" size={14} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={profileStyles.friendModalPrimaryText}>Switch Account</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={profileStyles.settingsFooter}>Version 1.0 · Demo build</Text>
          </View>
        </View>
      </Modal>

      {/* Edit profile modal */}
      <Modal
        animationType="fade"
        transparent
        visible={editVisible}
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={profileStyles.modalContainer}>
            <Text style={profileStyles.modalTitle}>Edit profile</Text>
            <TextInput
              style={profileStyles.modalInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Name"
              placeholderTextColor={colors.placeholder}
            />
            <TextInput
              style={profileStyles.modalInput}
              value={draftPhone}
              onChangeText={setDraftPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
            />
            <TextInput
              style={profileStyles.modalInput}
              value={draftEmail}
              onChangeText={setDraftEmail}
              placeholder="Email address"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={profileStyles.modalButtonRow}>
              <TouchableOpacity
                style={[profileStyles.modalButton, profileStyles.cancelButton]}
                onPress={() => setEditVisible(false)}
              >
                <Text style={profileStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[profileStyles.modalButton, profileStyles.saveButton]}
                onPress={saveEdits}
              >
                <Text style={profileStyles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Friend add / requests modal */}
      <Modal
        animationType="fade"
        transparent
        visible={friendModalVisible}
        onRequestClose={() => setFriendModalVisible(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={profileStyles.friendModalContainer}>
            {/* Header */}
            <View style={profileStyles.friendModalHeader}>
              <Text style={profileStyles.friendModalTitle}>Friends</Text>
              <TouchableOpacity onPress={() => setFriendModalVisible(false)}>
                <FontAwesome5 name="times" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Tabs inside modal */}
            <View style={profileStyles.friendModalTabRow}>
              <TouchableOpacity
                style={[
                  profileStyles.friendModalTabButton,
                  friendTab === 'add' && profileStyles.friendModalTabActive,
                ]}
                onPress={() => setFriendTab('add')}
              >
                <Text
                  style={[
                    profileStyles.friendModalTabText,
                    friendTab === 'add' && profileStyles.friendModalTabTextActive,
                  ]}
                >
                  Add Friend
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  profileStyles.friendModalTabButton,
                  friendTab === 'requests' && profileStyles.friendModalTabActive,
                ]}
                onPress={() => setFriendTab('requests')}
              >
                <Text
                  style={[
                    profileStyles.friendModalTabText,
                    friendTab === 'requests' &&
                      profileStyles.friendModalTabTextActive,
                  ]}
                >
                  Requests
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {friendTab === 'add' ? (
              <View style={{ marginTop: 10 }}>
                <Text style={profileStyles.friendModalHint}>
                  Search by phone or email. Name is optional.
                </Text>
                <TextInput
                  style={profileStyles.friendModalInput}
                  value={newFriendName}
                  onChangeText={setNewFriendName}
                  placeholder="Name (optional)"
                  placeholderTextColor={colors.placeholder}
                />
                <TextInput
                  style={profileStyles.friendModalInput}
                  value={newFriendPhone}
                  onChangeText={setNewFriendPhone}
                  placeholder="Phone number"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={profileStyles.friendModalInput}
                  value={newFriendEmail}
                  onChangeText={setNewFriendEmail}
                  placeholder="Email address"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TouchableOpacity
                  style={profileStyles.friendModalPrimaryButton}
                  onPress={handleSendFriendRequest}
                >
                  <Text style={profileStyles.friendModalPrimaryText}>
                    Send friend request
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 10, flex: 1 }}>
                {friendRequests.length === 0 ? (
                  <Text style={profileStyles.emptyText}>
                    No pending requests right now.
                  </Text>
                ) : (
                  <ScrollView style={{ maxHeight: 200 }}>
                    {friendRequests.map(req => (
                      <View key={req.id} style={profileStyles.requestRow}>
                        <View style={profileStyles.friendAvatar}>
                          <Text style={profileStyles.friendAvatarText}>
                            {req.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={profileStyles.friendName}>{req.name}</Text>
                          <Text style={profileStyles.friendSubText}>
                            {req.contact}
                          </Text>
                        </View>
                        <View style={profileStyles.requestButtons}>
                          <TouchableOpacity
                            style={profileStyles.requestAccept}
                            onPress={() => handleAcceptRequest(req)}
                          >
                            <FontAwesome5 name="check" size={12} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={profileStyles.requestDecline}
                            onPress={() => handleDeclineRequest(req)}
                          >
                            <FontAwesome5 name="times" size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Read-only archived event detail modal */}
      <Modal
        animationType="fade"
        transparent
        visible={archiveDetailVisible}
        onRequestClose={closeArchiveDetail}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={profileStyles.archiveDetailContainer}>
            <View style={profileStyles.archiveDetailHeader}>
              <Text style={profileStyles.archiveDetailTitle}>
                {selectedArchivedEvent?.title || 'Archived event'}
              </Text>
              <TouchableOpacity onPress={closeArchiveDetail}>
                <FontAwesome5 name="times" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Participants */}
            <View style={profileStyles.archiveDetailSection}>
              <Text style={profileStyles.archiveDetailLabel}>Participants</Text>
              <View
                style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}
              >
                {(selectedArchivedEvent?.participants || ['Me']).map((p, idx) => (
                  <View key={idx} style={profileStyles.chip}>
                    <Text style={profileStyles.chipText}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Items */}
            <View style={profileStyles.archiveDetailSection}>
              <Text style={profileStyles.archiveDetailLabel}>Items</Text>
              {selectedArchivedEvent?.items &&
              selectedArchivedEvent.items.length > 0 ? (
                <ScrollView style={{ maxHeight: 180, marginTop: 4 }}>
                  {selectedArchivedEvent.items.map(item => (
                    <View key={item.id} style={profileStyles.itemRow}>
                      <View style={profileStyles.bullet} />
                      <View style={{ flex: 1 }}>
                        <Text style={profileStyles.itemText}>{item.name}</Text>
                        {item.urgent ? (
                          <Text style={profileStyles.itemSubText}>
                            Marked urgent
                          </Text>
                        ) : null}
                        {item.bought && item.price ? (
                          <Text style={profileStyles.itemSubText}>
                            Bought · ${item.price}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={profileStyles.emptyText}>
                  No items in this event.
                </Text>
              )}
            </View>

            <Text style={profileStyles.archiveBanner}>
              Archived events are not editable. Recycle to home if you want to
              make changes.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
