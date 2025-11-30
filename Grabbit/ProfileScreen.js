import React, { useState, useContext } from 'react';
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

import { profileStyles } from './styles/profileStyles';
import { globalStyles, colors } from './styles/styles';
import { EventContext } from './EventContext';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState({
    name: 'Grab Bit',
    phone: '508-667-1234',
    email: 'grabbit@upenn.edu',
  });

  const [editVisible, setEditVisible] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftPhone, setDraftPhone] = useState(profile.phone);
  const [draftEmail, setDraftEmail] = useState(profile.email);

  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'archive'

  // --- Friends state ---
  const [friends, setFriends] = useState([
    { id: 1, name: 'Amy', phone: '555-111-2222', email: 'amy@example.com' },
    { id: 2, name: 'Ben', phone: '555-333-4444', email: 'ben@example.com' },
    { id: 3, name: 'Chris', phone: '555-555-6666', email: 'chris@example.com' },
  ]);

  // used in the "add friend" modal
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendPhone, setNewFriendPhone] = useState('');
  const [newFriendEmail, setNewFriendEmail] = useState('');

  // mock incoming friend requests (local-only)
  const [friendRequests, setFriendRequests] = useState([
    { id: 101, name: 'Diana', contact: 'diana@example.com' },
    { id: 102, name: 'Evan', contact: '555-777-8888' },
  ]);

  // --- Events from context ---
  const { archivedEvents, unarchiveEvent } = useContext(EventContext);

  // --- Archived event detail modal state ---
  const [selectedArchivedEvent, setSelectedArchivedEvent] = useState(null);
  const [archiveDetailVisible, setArchiveDetailVisible] = useState(false);

  // --- Friend modal state ---
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [friendTab, setFriendTab] = useState('add'); // 'add' | 'requests'

  const openEdit = () => {
    setDraftName(profile.name);
    setDraftPhone(profile.phone);
    setDraftEmail(profile.email);
    setEditVisible(true);
  };

  const saveEdits = () => {
    setProfile(prev => ({
      ...prev,
      name: draftName.trim() || prev.name,
      phone: draftPhone.trim() || prev.phone,
      email: draftEmail.trim() || prev.email,
    }));
    setEditVisible(false);
  };

  const handleSendFriendRequest = () => {
    if (!newFriendPhone.trim() && !newFriendEmail.trim()) {
      Alert.alert('Missing info', 'Please enter a phone number or email.');
      return;
    }

    // In a real app you’d call the backend here.
    Alert.alert('Request sent', 'Your friend request has been sent!');
    setNewFriendName('');
    setNewFriendPhone('');
    setNewFriendEmail('');
  };

  const handleAcceptRequest = (request) => {
    // move to friends list
    setFriends(prev => [
      {
        id: Date.now(),
        name: request.name,
        phone: request.contact.match(/\d/)
          ? request.contact
          : '',
        email: request.contact.includes('@')
          ? request.contact
          : '',
      },
      ...prev,
    ]);
    // remove from requests
    setFriendRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const handleDeclineRequest = (id) => {
    setFriendRequests(prev => prev.filter(r => r.id !== id));
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
      {/* Friends list card */}
      <View style={localStyles.sectionCard}>

        {/* Row to open friend modal */}
        <TouchableOpacity
          style={localStyles.addFriendRow}
          onPress={handleOpenFriendModal}
        >
          <View style={localStyles.addFriendIconCircle}>
            <FontAwesome5 name="user-plus" size={13} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={localStyles.addFriendTitle}>Add or manage friends</Text>
            <Text style={localStyles.addFriendSubtitle}>
              Send new requests or review invites
            </Text>
          </View>
        </TouchableOpacity>

        {/* Friend list */}
        {friends.length === 0 ? (
          <Text style={localStyles.emptyText}>
            No friends yet. Add someone above!
          </Text>
        ) : (
          friends.map(friend => (
            <View key={friend.id} style={localStyles.friendRow}>
              <View style={localStyles.friendAvatar}>
                <Text style={localStyles.friendAvatarText}>
                  {friend.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={localStyles.friendName}>{friend.name}</Text>
                {friend.phone ? (
                  <Text style={localStyles.friendSubText}>{friend.phone}</Text>
                ) : null}
                {friend.email ? (
                  <Text style={localStyles.friendSubText}>{friend.email}</Text>
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
      <View style={localStyles.sectionCard}>

        {archivedEvents.length === 0 ? (
          <Text style={localStyles.emptyText}>
            Nothing archived yet. Tap the archive icon on a card to send it here.
          </Text>
        ) : (
          archivedEvents.map(event => (
            <View key={event.id} style={localStyles.archiveCardWrapper}>
              {/* Unarchive badge */}
              <TouchableOpacity
                style={localStyles.unarchiveBadge}
                onPress={() => unarchiveEvent(event.id)}
              >
                <FontAwesome5 name="undo" size={10} color="#fff" />
              </TouchableOpacity>

              {/* Open read-only detail modal */}
              <TouchableOpacity
                style={localStyles.archiveCard}
                onPress={() => handleOpenArchivedEvent(event)}
              >
                <Text style={localStyles.archiveTitle}>{event.title}</Text>
                <Text style={localStyles.archiveSubtitle}>
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
          <TouchableOpacity style={profileStyles.iconButton}>
            <FontAwesome5 name="cog" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={profileStyles.avatarLarge}>
          <Text style={profileStyles.avatarTextLarge}>Me</Text>
        </View>

        {/* User Info – slightly larger font */}
        <Text style={[profileStyles.userName, { fontSize: 24 }]}>
          {profile.name}
        </Text>
        <Text style={[profileStyles.userInfoText, { fontSize: 16 }]}>
          {profile.phone}
        </Text>
        <Text style={[profileStyles.userInfoText, { fontSize: 16 }]}>
          {profile.email}
        </Text>

        {/* Tabs + content */}
        <View style={{ flex: 1, width: '100%', marginTop: 32 }}>
          {/* Tab buttons */}
          <View style={localStyles.tabRow}>
            <TouchableOpacity
              style={[
                localStyles.tabButton,
                activeTab === 'friends' && localStyles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('friends')}
            >
              <Text
                style={[
                  localStyles.tabText,
                  activeTab === 'friends' && localStyles.tabTextActive,
                ]}
              >
                Friends
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                localStyles.tabButton,
                activeTab === 'archive' && localStyles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('archive')}
            >
              <Text
                style={[
                  localStyles.tabText,
                  activeTab === 'archive' && localStyles.tabTextActive,
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
          <View style={localStyles.friendModalContainer}>
            {/* Header */}
            <View style={localStyles.friendModalHeader}>
              <Text style={localStyles.friendModalTitle}>Friends</Text>
              <TouchableOpacity onPress={() => setFriendModalVisible(false)}>
                <FontAwesome5 name="times" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Tabs inside modal */}
            <View style={localStyles.friendModalTabRow}>
              <TouchableOpacity
                style={[
                  localStyles.friendModalTabButton,
                  friendTab === 'add' && localStyles.friendModalTabActive,
                ]}
                onPress={() => setFriendTab('add')}
              >
                <Text
                  style={[
                    localStyles.friendModalTabText,
                    friendTab === 'add' && localStyles.friendModalTabTextActive,
                  ]}
                >
                  Add Friend
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  localStyles.friendModalTabButton,
                  friendTab === 'requests' && localStyles.friendModalTabActive,
                ]}
                onPress={() => setFriendTab('requests')}
              >
                <Text
                  style={[
                    localStyles.friendModalTabText,
                    friendTab === 'requests' &&
                      localStyles.friendModalTabTextActive,
                  ]}
                >
                  Requests
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {friendTab === 'add' ? (
              <View style={{ marginTop: 10 }}>
                <Text style={localStyles.friendModalHint}>
                  Search by phone or email. Name is optional.
                </Text>
                <TextInput
                  style={localStyles.friendModalInput}
                  value={newFriendName}
                  onChangeText={setNewFriendName}
                  placeholder="Name (optional)"
                  placeholderTextColor={colors.placeholder}
                />
                <TextInput
                  style={localStyles.friendModalInput}
                  value={newFriendPhone}
                  onChangeText={setNewFriendPhone}
                  placeholder="Phone number"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={localStyles.friendModalInput}
                  value={newFriendEmail}
                  onChangeText={setNewFriendEmail}
                  placeholder="Email address"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TouchableOpacity
                  style={localStyles.friendModalPrimaryButton}
                  onPress={handleSendFriendRequest}
                >
                  <Text style={localStyles.friendModalPrimaryText}>
                    Send friend request
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 10, flex: 1 }}>
                {friendRequests.length === 0 ? (
                  <Text style={localStyles.emptyText}>
                    No pending requests right now.
                  </Text>
                ) : (
                  <ScrollView style={{ maxHeight: 200 }}>
                    {friendRequests.map(req => (
                      <View key={req.id} style={localStyles.requestRow}>
                        <View style={localStyles.friendAvatar}>
                          <Text style={localStyles.friendAvatarText}>
                            {req.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={localStyles.friendName}>{req.name}</Text>
                          <Text style={localStyles.friendSubText}>
                            {req.contact}
                          </Text>
                        </View>
                        <View style={localStyles.requestButtons}>
                          <TouchableOpacity
                            style={localStyles.requestAccept}
                            onPress={() => handleAcceptRequest(req)}
                          >
                            <FontAwesome5
                              name="check"
                              size={12}
                              color="#fff"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={localStyles.requestDecline}
                            onPress={() => handleDeclineRequest(req.id)}
                          >
                            <FontAwesome5
                              name="times"
                              size={12}
                              color="#fff"
                            />
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
          <View style={localStyles.archiveDetailContainer}>
            <View style={localStyles.archiveDetailHeader}>
              <Text style={localStyles.archiveDetailTitle}>
                {selectedArchivedEvent?.title || 'Archived event'}
              </Text>
              <TouchableOpacity onPress={closeArchiveDetail}>
                <FontAwesome5 name="times" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Participants */}
            <View style={localStyles.archiveDetailSection}>
              <Text style={localStyles.archiveDetailLabel}>Participants</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                {(selectedArchivedEvent?.participants || ['Me']).map((p, idx) => (
                  <View key={idx} style={localStyles.chip}>
                    <Text style={localStyles.chipText}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Items */}
            <View style={localStyles.archiveDetailSection}>
              <Text style={localStyles.archiveDetailLabel}>Items</Text>
              {selectedArchivedEvent?.items && selectedArchivedEvent.items.length > 0 ? (
                <ScrollView style={{ maxHeight: 180, marginTop: 4 }}>
                  {selectedArchivedEvent.items.map(item => (
                    <View key={item.id} style={localStyles.itemRow}>
                      <View style={localStyles.bullet} />
                      <View style={{ flex: 1 }}>
                        <Text style={localStyles.itemText}>{item.name}</Text>
                        {item.urgent ? (
                          <Text style={localStyles.itemSubText}>Marked urgent</Text>
                        ) : null}
                        {item.bought && item.price ? (
                          <Text style={localStyles.itemSubText}>
                            Bought · ${item.price}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={localStyles.emptyText}>No items in this event.</Text>
              )}
            </View>

            <Text style={localStyles.archiveBanner}>
              Archived events are not editable. Recycle to home if you want to
              make changes.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// extra local styles specific to tabs/friends/archive
const localStyles = {
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tabButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d0c9bd',
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'System',
    color: colors.text,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 10,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
  },

  /* Friends list */
  addFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: '#f5f2eb',
    paddingHorizontal: 10,
  },
  addFriendIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addFriendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addFriendSubtitle: {
    fontSize: 14,
    color: '#777',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  friendAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#d0ac8c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  friendAvatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  friendSubText: {
    fontSize: 14,
    color: '#777',
  },

  /* Archive cards */
  archiveCardWrapper: {
    marginBottom: 10,
  },
  archiveCard: {
    backgroundColor: '#f7e0c5',
    borderRadius: 16,
    padding: 12,
    paddingTop: 16,
  },
  archiveTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  archiveSubtitle: {
    fontSize: 14,
    color: '#6e6e6e',
  },
  unarchiveBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Archived detail modal */
  archiveDetailContainer: {
    width: '88%',
    maxHeight: '80%',
    backgroundColor: '#f2efe9',
    borderRadius: 20,
    padding: 16,
  },
  archiveDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  archiveDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  archiveDetailSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  archiveDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  chip: {
    backgroundColor: '#e0d2c0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
    marginRight: 8,
  },
  itemText: {
    fontSize: 16,
    color: colors.text,
  },
  itemSubText: {
    fontSize: 14,
    color: '#777',
  },
  archiveBanner: {
    marginTop: 4,
    fontSize: 14,
    color: '#aa5a4a',
  },

  /* Friend modal */
  friendModalContainer: {
    width: '88%',
    maxHeight: '75%',
    backgroundColor: '#f2efe9',
    borderRadius: 20,
    padding: 16,
  },
  friendModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  friendModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  friendModalTabRow: {
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: '#e6dfd2',
    padding: 3,
    marginBottom: 10,
  },
  friendModalTabButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendModalTabActive: {
    backgroundColor: '#fff',
  },
  friendModalTabText: {
    fontSize: 16,
    color: '#6b5b4b',
  },
  friendModalTabTextActive: {
    fontWeight: '600',
    color: colors.text,
  },
  friendModalHint: {
    fontSize: 14,
    color: '#777',
    marginBottom: 6,
  },
  friendModalInput: {
    backgroundColor: '#f5f2eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
  },
  friendModalPrimaryButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  friendModalPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  requestAccept: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDecline: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d9534f',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
