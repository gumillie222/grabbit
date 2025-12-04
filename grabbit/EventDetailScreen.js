import React, { useState, useMemo, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';
import { io } from 'socket.io-client';

import { globalStyles, colors, fonts } from './styles/styles.js';
import { detailStyles } from './styles/eventDetailStyles.js';
import { EventContext } from './EventContext';
import { useAuth } from './AuthContext';
import { SERVER_URL } from './config';
import { getUserColors, getUserInitial } from './userColors';

// ---- BASE URL ----
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

export default function EventDetailScreen({ route, navigation }) {
  const {
    eventId,
    eventTitle = 'Unit 602',
    isNew = false,
    initialItems,
    participants: initialParticipants,
    isArchived = false,
  } = route.params || {};

  const isReadOnly = !!isArchived;

  const eventCtx = useContext(EventContext);
  const ctxUpdateItems = eventCtx?.updateItems;
  const ctxUpdateParticipants = eventCtx?.updateParticipants;
  const contextFriends = eventCtx?.friends || [];
  const { currentUser } = useAuth();
  const socketRef = useRef(null);
  
  // Get event from context to sync with
  const contextEvent = eventCtx?.getEventById?.(eventId);
  
  // Check if user still has access to this event
  useEffect(() => {
    if (!eventId || !currentUser?.id || isNew) return;
    
    // Check if event exists in context and user is still a participant
    const event = eventCtx?.getEventById?.(eventId);
    if (!event) {
      // Event doesn't exist in context - might have been removed
      // Redirect to home screen
      console.log('[EventDetailScreen] Event not found in context, redirecting to home');
      navigation.navigate('HomeList');
      return;
    }
    
    // Check if current user is in participants
    const userIsParticipant = event.participants?.some(p => 
      p === currentUser.name || p === currentUser.id
    );
    
    if (!userIsParticipant) {
      // User is no longer a participant - redirect to home screen
      console.log('[EventDetailScreen] User no longer has access to event, redirecting to home');
      Alert.alert(
        'Access Removed',
        'You no longer have access to this event.',
        [{ text: 'OK', onPress: () => navigation.navigate('HomeList') }]
      );
    }
  }, [eventId, currentUser?.id, contextEvent, eventCtx, navigation, isNew]);

  const [activeTab, setActiveTab] = useState('List');
  const [hasSettled, setHasSettled] = useState(false);
  const [hintExpanded, setHintExpanded] = useState(false);

  const [newItemText, setNewItemText] = useState('');
  const [newItemUrgent, setNewItemUrgent] = useState(false);

  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [showRecent, setShowRecent] = useState(true);
  const [editingPriceItemId, setEditingPriceItemId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');

  // sharers when buying a new item
  const [buySharedBy, setBuySharedBy] = useState([]);
  const [shareDropdownVisible, setShareDropdownVisible] = useState(false);

  // editing sharedBy for items already in Recently Bought
  const [sharedByEditItemId, setSharedByEditItemId] = useState(null);
  const [sharedByDraft, setSharedByDraft] = useState([]);
  const [sharedByModalVisible, setSharedByModalVisible] = useState(false);

  const [items, setItems] = useState(
    initialItems && Array.isArray(initialItems)
      ? JSON.parse(JSON.stringify(initialItems))
      : []
  );

  const [participants, setParticipants] = useState(
    initialParticipants || (isNew && currentUser?.id ? [currentUser.id] : [])
  );

  // Sync participants with contextEvent when it changes
  useEffect(() => {
    if (contextEvent?.participants && Array.isArray(contextEvent.participants)) {
      setParticipants(contextEvent.participants);
    }
  }, [contextEvent?.participants]);

  // Helper to get user name from ID (for display)
  const getUserNameFromId = (userId) => {
    if (!userId) return null;
    // Check if it's the current user
    if (userId === currentUser?.id) return currentUser?.name || 'Me';
    // Check friends
    const friend = contextFriends.find(f => f.id === userId);
    if (friend) return friend.name;
    // Check participants - if it's already a name, return it (backward compatibility)
    if (participants.includes(userId) && typeof userId === 'string' && userId !== userId.toLowerCase()) {
      return userId; // Might be a name already
    }
    // Fallback: return the ID
    return userId;
  };

  const [participantsModalVisible, setParticipantsModalVisible] =
    useState(false);
  const [tempParticipants, setTempParticipants] = useState([]);

  // AI suggestions
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // edit item name
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');

  // split details modal
  const [detailedModalVisible, setDetailedModalVisible] = useState(false);

  const showArchivedAlert = () =>
    Alert.alert(
      'Archived event',
      'Archived events are not editable. Please recycle it back to home page if you want to make any changes.'
    );

  // Debounce timer refs
  const itemsUpdateTimeoutRef = useRef(null);
  const participantsUpdateTimeoutRef = useRef(null);
  const lastUpdateTimestampRef = useRef(0);
  // Flag to prevent persisting updates that came from remote (to avoid infinite loop)
  const isApplyingRemoteUpdateRef = useRef(false);
  // Track last persisted values to avoid re-persisting the same data
  const lastPersistedItemsRef = useRef(null);
  const lastPersistedParticipantsRef = useRef(null);

  // Set up socket connection for real-time updates on this specific event
  useEffect(() => {
    if (!eventId || !currentUser?.id || isReadOnly) return;

    // Disconnect existing socket if any
    if (socketRef.current) {
      console.log('[EventDetailScreen] Disconnecting old socket before reconnecting...');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      query: { userId: currentUser.id },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[EventDetailScreen] Socket connected for event:', eventId, 'userId:', currentUser?.id);
    });
    
    socket.on('disconnect', () => {
      console.log('[EventDetailScreen] Socket disconnected for event:', eventId);
    });
    
    socket.on('connect_error', (error) => {
      console.error('[EventDetailScreen] Socket connection error:', error);
    });

    // Listen for deletion of this event
    socket.on('event:delete', (payload) => {
      const { eventId: deletedEventId, fromUserId } = payload;
      
      // Only process deletions for this event
      if (deletedEventId !== eventId) return;
      
      console.log('[EventDetailScreen] Event was deleted by another user, redirecting to home');
      Alert.alert(
        'Event Deleted',
        'This event has been deleted.',
        [{ text: 'OK', onPress: () => navigation.navigate('HomeList') }]
      );
    });

    // Listen for updates to this specific event
    socket.on('event:update', (payload) => {
      const { eventId: updatedEventId, eventData, fromUserId, serverTs } = payload;
      
      // Only process updates for this event
      if (updatedEventId !== eventId) return;
      
      // Ignore our own updates
      if (fromUserId === currentUser.id) return;

      // Debounce: only process if this update is newer than the last one we processed
      if (serverTs && serverTs <= lastUpdateTimestampRef.current) {
        console.log('[EventDetailScreen] Ignoring stale update');
        return;
      }
      lastUpdateTimestampRef.current = serverTs || Date.now();

      console.log('[EventDetailScreen] Received real-time update for event:', eventId);
      console.log('[EventDetailScreen] Update from user:', fromUserId, 'items count:', eventData.items?.length || 0);
      
      // Log claimed items for debugging
      if (eventData.items && Array.isArray(eventData.items)) {
        const claimedItems = eventData.items.filter(item => item.claimedBy);
        if (claimedItems.length > 0) {
          console.log('[EventDetailScreen] Received items with claims:', claimedItems.map(item => ({
            id: item.id,
            name: item.name,
            claimedBy: item.claimedBy
          })));
        }
      }

      // Update items immediately (remove debounce for real-time feel)
      if (eventData.items && Array.isArray(eventData.items)) {
        // Clear any pending update
        if (itemsUpdateTimeoutRef.current) {
          clearTimeout(itemsUpdateTimeoutRef.current);
        }
        
        // Update immediately for real-time updates
        setItems(prevItems => {
          const prevStr = JSON.stringify(prevItems);
          const newStr = JSON.stringify(eventData.items);
          if (prevStr !== newStr) {
            console.log('[EventDetailScreen] Updated items from real-time sync');
            // Set flag to prevent persist effect from running
            isApplyingRemoteUpdateRef.current = true;
            // Clear flag after a delay to allow next update
            setTimeout(() => {
              isApplyingRemoteUpdateRef.current = false;
            }, 500);
            return eventData.items;
          }
          console.log('[EventDetailScreen] Items unchanged, skipping update');
          return prevItems;
        });
      }

      // Debounce participants update with a small delay
      if (eventData.participants && Array.isArray(eventData.participants)) {
        // Clear any pending update
        if (participantsUpdateTimeoutRef.current) {
          clearTimeout(participantsUpdateTimeoutRef.current);
        }
        
        // Update after a short delay
        participantsUpdateTimeoutRef.current = setTimeout(() => {
          setParticipants(prevParticipants => {
            const prevStr = JSON.stringify(prevParticipants);
            const newStr = JSON.stringify(eventData.participants);
            if (prevStr !== newStr) {
              console.log('[EventDetailScreen] Updated participants from real-time sync');
              // Set flag to prevent persist effect from running
              isApplyingRemoteUpdateRef.current = true;
              // Clear flag after a delay to allow next update
              setTimeout(() => {
                isApplyingRemoteUpdateRef.current = false;
              }, 500);
              return eventData.participants;
            }
            return prevParticipants;
          });
        }, 300); // 300ms delay to batch rapid updates
      }
    });

    return () => {
      // Clean up timeouts
      if (itemsUpdateTimeoutRef.current) {
        clearTimeout(itemsUpdateTimeoutRef.current);
      }
      if (participantsUpdateTimeoutRef.current) {
        clearTimeout(participantsUpdateTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [eventId, currentUser?.id, isReadOnly]);

  // Sync with EventContext when it updates (fallback) - with debouncing
  const contextSyncTimeoutRef = useRef(null);
  useEffect(() => {
    if (!contextEvent || !eventId) return;
    
    // Don't sync if we're currently applying a remote update
    if (isApplyingRemoteUpdateRef.current) return;
    
    // Clear any pending sync
    if (contextSyncTimeoutRef.current) {
      clearTimeout(contextSyncTimeoutRef.current);
    }
    
    // Debounce the sync to prevent rapid updates
    contextSyncTimeoutRef.current = setTimeout(() => {
      // Only sync if the context event has newer data
      if (contextEvent.items && Array.isArray(contextEvent.items)) {
        // Check if items are different
        const contextItemsStr = JSON.stringify(contextEvent.items);
        const localItemsStr = JSON.stringify(items);
        
        if (contextItemsStr !== localItemsStr) {
          console.log('[EventDetailScreen] Syncing items from EventContext');
          // Set flag to prevent persist effect from running
          isApplyingRemoteUpdateRef.current = true;
          setItems(contextEvent.items);
          // Clear flag after a delay
          setTimeout(() => {
            isApplyingRemoteUpdateRef.current = false;
          }, 500);
        }
      }

      if (contextEvent.participants && Array.isArray(contextEvent.participants)) {
        const contextParticipantsStr = JSON.stringify(contextEvent.participants);
        const localParticipantsStr = JSON.stringify(participants);
        
        if (contextParticipantsStr !== localParticipantsStr) {
          console.log('[EventDetailScreen] Syncing participants from EventContext');
          // Set flag to prevent persist effect from running
          isApplyingRemoteUpdateRef.current = true;
          setParticipants(contextEvent.participants);
          // Clear flag after a delay
          setTimeout(() => {
            isApplyingRemoteUpdateRef.current = false;
          }, 500);
        }
      }
    }, 500); // 500ms delay for context sync (longer since it's a fallback)
    
    return () => {
      if (contextSyncTimeoutRef.current) {
        clearTimeout(contextSyncTimeoutRef.current);
      }
    };
  }, [contextEvent, eventId, items, participants]);

  // persist items (but skip if this update came from remote to avoid infinite loop)
  useEffect(() => {
    if (isReadOnly) return;
    if (!eventId || !ctxUpdateItems) return;
    if (isApplyingRemoteUpdateRef.current) {
      // Skip persisting if this update came from remote
      return;
    }
    
    // Check if items actually changed from what we last persisted
    const itemsStr = JSON.stringify(items);
    if (lastPersistedItemsRef.current === itemsStr) {
      // Already persisted this exact data, skip
      return;
    }
    
    lastPersistedItemsRef.current = itemsStr;
    ctxUpdateItems(eventId, items);
  }, [items, eventId, ctxUpdateItems, isReadOnly]);

  // persist participants (but skip if this update came from remote to avoid infinite loop)
  useEffect(() => {
    if (isReadOnly) return;
    if (!eventId || !ctxUpdateParticipants) return;
    if (isApplyingRemoteUpdateRef.current) {
      // Skip persisting if this update came from remote
      return;
    }
    
    // Check if participants actually changed from what we last persisted
    const participantsStr = JSON.stringify(participants);
    if (lastPersistedParticipantsRef.current === participantsStr) {
      // Already persisted this exact data, skip
      return;
    }
    
    lastPersistedParticipantsRef.current = participantsStr;
    ctxUpdateParticipants(eventId, participants);
  }, [participants, eventId, ctxUpdateParticipants, isReadOnly]);

  const activeItems = items.filter(i => !i.bought);
  const recentItems = items.filter(i => i.bought);

  // --- SPLIT LOGIC (uses sharedBy if present) ---
  const splitData = useMemo(() => {
    const balances = {};
    participants.forEach(p => (balances[p] = 0));

    // Filter bought items to only include those with valid buyers in participants
    // Use currentUser?.id instead of name since participants contains IDs
    const bought = items.filter(item => {
      if (!item.bought || !item.price || parseFloat(item.price) <= 0) return false;
      const buyer = item.claimedBy || currentUser?.id;
      return buyer && participants.includes(buyer);
    });
    
    // Calculate total spent only from items with valid participants
    const totalSpent = bought.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0
    );

    bought.forEach(item => {
      const price = parseFloat(item.price);
      const buyer = item.claimedBy || currentUser?.id;
      
      // Skip items where the buyer is not in the current participants list
      if (!buyer || !participants.includes(buyer)) {
        console.log(`[Split] Skipping item "${item.name}" - buyer "${buyer}" is not in participants`);
        return;
      }
      
      // Get sharers, filtering to only include current participants
      let rawSharers = [];
      if (Array.isArray(item.sharedBy) && item.sharedBy.length > 0) {
        // Filter sharedBy to only include current participants (sharedBy should contain IDs)
        rawSharers = item.sharedBy.filter(id => participants.includes(id));
      }
      
      // If no valid sharers after filtering, default to buyer only
      if (rawSharers.length === 0) {
        rawSharers = [buyer];
      }
      
      // Filter sharers to only include current participants
      const sharers = rawSharers.filter(s => participants.includes(s));
      
      // Skip if no valid sharers remain
      if (sharers.length === 0) {
        console.log(`[Split] Skipping item "${item.name}" - no valid sharers after filtering`);
        return;
      }
      
      const perPerson = price / sharers.length;

      // Ensure buyer and all sharers have balance entries
      if (!balances[buyer]) balances[buyer] = 0;
      
      // First, credit the buyer for the full amount they paid
      balances[buyer] += price;
      
      // Then, debit each sharer (including the buyer if they're sharing) for their share
      sharers.forEach(person => {
        // Skip if person is not in participants (shouldn't happen after filtering, but safety check)
        if (!participants.includes(person)) {
          console.log(`[Split] Skipping sharer "${person}" - not in participants`);
          return;
        }
        
        if (!balances[person]) balances[person] = 0;
        balances[person] -= perPerson; // they owe their share
      });
    });

    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([person, bal]) => {
      if (bal < -0.01) debtors.push({ person, amount: -bal });
      if (bal > 0.01) creditors.push({ person, amount: bal });
    });

    console.log('[Split] Debtors:', debtors);
    console.log('[Split] Creditors:', creditors);

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        transactions.push({
          from: debtor.person,
          to: creditor.person,
          amount: amount.toFixed(2),
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount <= 0.01) d++;
      if (creditor.amount <= 0.01) c++;
    }

    console.log('[Split] Final transactions:', transactions);
    console.log('[Split] Final balances:', balances);

    return { balances, transactions, totalSpent: totalSpent.toFixed(2) };
  }, [items, participants, currentUser?.id]);

  const closeAiModal = () => {
    setAiModalVisible(false);
    setIsGenerating(false);
  };

  // reset settled flag if new bought items appear
  useEffect(() => {
    const bought = items.filter(
      item => item.bought && item.price && parseFloat(item.price) > 0
    );
    if (bought.length > 0) setHasSettled(false);
  }, [items]);

  // ---- ITEM ACTIONS ----
  const toggleItemUrgency = id => {
    if (isReadOnly) return showArchivedAlert();
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, urgent: !item.urgent } : item
      )
    );
  };

  const toggleItemClaim = id => {
    if (isReadOnly) return showArchivedAlert();
    setItems(current =>
      current.map(item =>
        item.id === id
          ? { ...item, claimedBy: item.claimedBy === currentUser?.id ? null : currentUser?.id }
          : item
      )
    );
  };

  const handleSettle = () => {
    if (isReadOnly) return showArchivedAlert();
    setItems(current => current.filter(item => !item.bought));
    setHasSettled(true);
  };

  const handleAddItem = () => {
    if (isReadOnly) return showArchivedAlert();
    if (!newItemText.trim()) return;
    setItems(current => [
      ...current,
      {
        id: Date.now(),
        name: newItemText,
        urgent: newItemUrgent,
        claimedBy: null,
        bought: false,
        price: null,
        sharedBy: [],
      },
    ]);
    setNewItemText('');
    setNewItemUrgent(false);
  };

  // --- SHARING PICKERS ---

  const toggleSharePersonInDropdown = id => {
    setBuySharedBy(prev => {
      const isSelected = prev.includes(id);
      let next = isSelected ? prev.filter(n => n !== id) : [...prev, id];
      if (next.length === 0) next = [currentUser?.id].filter(Boolean); // never empty
      return next;
    });
  };

  const handleToggleBought = item => {
    if (isReadOnly) return showArchivedAlert();

    if (!item.bought) {
      setSelectedItem(item);
      setPriceInput('');
      // Default share: everyone in participants (or just current user if empty)
      setBuySharedBy(participants.length > 0 ? [...participants] : [currentUser?.id].filter(Boolean));
      setShareDropdownVisible(false);
      setBuyModalVisible(true);
    } else {
      setItems(current =>
        current.map(it =>
          it.id === item.id
            ? {
                ...it,
                bought: false,
                price: null,
                claimedBy: null,
                sharedBy: undefined,
              }
            : it
        )
      );
    }
  };

  // Helper function to format price to 2 decimal places
  const formatPrice = (price) => {
    if (!price || price === '') return '0.00';
    const num = parseFloat(price);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const handlePriceInputChange = text => {
    const numericRegex = /^\d*\.?\d*$/;
    if (text === '' || numericRegex.test(text)) setPriceInput(text);
  };

  const handleEditPrice = item => {
    if (isReadOnly) return showArchivedAlert();
    setEditingPriceItemId(item.id);
    setEditingPriceValue(item.price || '');
  };

  const handleSavePrice = itemId => {
    if (isReadOnly) return showArchivedAlert();
    setItems(current =>
      current.map(item =>
        item.id === itemId ? { ...item, price: formatPrice(editingPriceValue) } : item
      )
    );
    setEditingPriceItemId(null);
    setEditingPriceValue('');
  };

  const handlePriceEditChange = text => {
    const numericRegex = /^\d*\.?\d*$/;
    if (text === '' || numericRegex.test(text)) setEditingPriceValue(text);
  };

  const handleBuyConfirm = () => {
    if (isReadOnly) return showArchivedAlert();
    if (selectedItem) {
      setItems(current =>
        current.map(item =>
          item.id === selectedItem.id
            ? {
                ...item,
                bought: true,
                price: formatPrice(priceInput),
                claimedBy: currentUser?.id || null,
                sharedBy: buySharedBy.length > 0 ? buySharedBy : [currentUser?.id].filter(Boolean),
              }
            : item
        )
      );
    }
    setBuyModalVisible(false);
    setPriceInput('');
    setSelectedItem(null);
  };

  // --- EDIT sharedBy FOR RECENT ITEMS (modal) ---

  const startEditSharedBy = item => {
    if (isReadOnly) return showArchivedAlert();
    const currentSharers =
      Array.isArray(item.sharedBy) && item.sharedBy.length > 0
        ? item.sharedBy
        : [item.claimedBy || currentUser?.id].filter(Boolean);
    setSharedByDraft(currentSharers);
    setSharedByEditItemId(item.id);
    setSharedByModalVisible(true);
  };

  const toggleSharedByDraftPerson = id => {
    setSharedByDraft(prev => {
      const isSelected = prev.includes(id);
      let next = isSelected ? prev.filter(n => n !== id) : [...prev, id];
      if (next.length === 0) next = [currentUser?.id].filter(Boolean);
      return next;
    });
  };

  const cancelEditSharedBy = () => {
    setSharedByEditItemId(null);
    setSharedByDraft([]);
    setSharedByModalVisible(false);
  };

  const confirmEditSharedBy = () => {
    if (sharedByEditItemId == null) return;
    const cleaned = sharedByDraft.length ? sharedByDraft : [currentUser?.id].filter(Boolean);
    setItems(current =>
      current.map(item =>
        item.id === sharedByEditItemId ? { ...item, sharedBy: cleaned } : item
      )
    );
    setSharedByEditItemId(null);
    setSharedByDraft([]);
    setSharedByModalVisible(false);
  };

  // --- EDIT ITEM NAME ---

  const openEditModal = item => {
    if (isReadOnly) return showArchivedAlert();
    setEditingItem(item);
    setEditText(item.name);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (isReadOnly) return showArchivedAlert();
    if (!editingItem) return;
    setItems(current =>
      current.map(it =>
        it.id === editingItem.id ? { ...it, name: editText } : it
      )
    );
    setEditModalVisible(false);
    setEditingItem(null);
    setEditText('');
  };

  const handleDeleteItem = () => {
    if (isReadOnly) return showArchivedAlert();
    if (!editingItem) return;
    setItems(current => current.filter(it => it.id !== editingItem.id));
    setEditModalVisible(false);
    setEditingItem(null);
    setEditText('');
  };

  // --- AI SUGGESTIONS ---

  const handleGenerateSuggestions = async () => {
    if (isReadOnly) return showArchivedAlert();
    if (!description.trim()) return;

    try {
      setIsGenerating(true);
      const url = `${BASE_URL}/api/suggestions`;

      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          description,
          pastItems: items.map(it => it.name),
        }),
        signal: controller.signal,
      });

      clearTimeout(fetchTimeout);

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const mapped = (data.suggestions || []).map((name, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        name,
        selected: false,
      }));
      setSuggestions(mapped);
    } catch (e) {
      if (e.name === 'AbortError') {
        Alert.alert('Request timed out. Please try again.');
      } else {
        console.error('[EventDetailScreen] AI request error:', e);
        Alert.alert(
          "Couldn't fetch AI suggestions. Please check your connection."
        );
      }
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSuggestion = id => {
    if (isReadOnly) return showArchivedAlert();
    setSuggestions(prev =>
      prev.map(s => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const addSelectedSuggestions = () => {
    if (isReadOnly) return showArchivedAlert();
    const selected = suggestions.filter(s => s.selected);
    if (!selected.length) return;

    const newItems = selected.map(s => ({
      id: Date.now() + Math.random(),
      name: s.name,
      urgent: false,
      claimedBy: null,
      bought: false,
      price: null,
      sharedBy: [],
    }));

    setItems(current => [...current, ...newItems]);
    setSuggestions(prev => prev.map(s => ({ ...s, selected: false })));
    setAiModalVisible(false);
  };

  // --- PARTICIPANTS EDITOR ---

  const openParticipantsModal = () => {
    if (isReadOnly) return showArchivedAlert();
    // Normalize IDs to lowercase and filter out current user
    const currentUserLower = currentUser?.id?.toLowerCase();
    const currentFriends = participants
      .map(id => id?.toLowerCase())
      .filter(id => id && id !== currentUserLower);
    // Deduplicate
    setTempParticipants([...new Set(currentFriends)]);
    setParticipantsModalVisible(true);
  };

  const toggleTempParticipant = id => {
    const normalizedId = id?.toLowerCase();
    setTempParticipants(prev => {
      const normalizedPrev = prev.map(p => p?.toLowerCase());
      if (normalizedPrev.includes(normalizedId)) {
        // Remove (case-insensitive)
        return prev.filter(p => p?.toLowerCase() !== normalizedId);
      } else {
        // Add (normalized ID to avoid duplicates)
        return [...prev, normalizedId];
      }
    });
  };

  const cancelParticipantsSelection = () => {
    setParticipantsModalVisible(false);
    setTempParticipants([]);
  };

  const confirmParticipantsSelection = async () => {
    // New participant list: current user + whatever was selected (all IDs)
    // Deduplicate to prevent adding the same participant twice
    const allParticipants = [currentUser?.id, ...tempParticipants].filter(Boolean);
    const newParticipants = [...new Set(allParticipants.map(id => id.toLowerCase()))];
    
    // Check if any participants are being removed (case-insensitive comparison)
    const currentUserLower = currentUser?.id?.toLowerCase();
    const newParticipantsLower = newParticipants.map(p => p?.toLowerCase());
    const removedParticipants = participants.filter(
      p => {
        const pLower = p?.toLowerCase();
        return pLower !== currentUserLower && !newParticipantsLower.includes(pLower);
      }
    );
    
    // If someone is being removed, show confirmation dialog
    if (removedParticipants.length > 0) {
      const removedNames = removedParticipants.map(id => getUserNameFromId(id) || id).join(', ');
      Alert.alert(
        'Remove Participants?',
        `Are you sure you want to remove ${removedNames} from this event? They will no longer have access to it.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              // Reset temp participants to current state
              const currentFriends = participants.filter(id => id !== currentUser?.id);
              setTempParticipants(currentFriends);
            },
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                // Update participants state
                setParticipants(newParticipants);
                
                // Clean up all items so sharedBy/claimedBy never reference removed people
                setItems(currentItems =>
                  currentItems.map(item => {
                    const currentSharers = Array.isArray(item.sharedBy) ? item.sharedBy : [];
            
                    // Keep only sharers that are still in the event
                    const cleanedSharedBy = currentSharers.filter(id =>
                      newParticipants.includes(id)
                    );
            
                    // If claimedBy has been removed, fall back to current user
                    let cleanedClaimedBy = item.claimedBy;
                    if (cleanedClaimedBy && !newParticipants.includes(cleanedClaimedBy)) {
                      cleanedClaimedBy = currentUser?.id || null;
                    }
                    
                    // If sharedBy becomes empty after cleaning and item is bought, 
                    // default to the buyer (or current user if buyer was removed)
                    let finalSharedBy = cleanedSharedBy;
                    if (item.bought && finalSharedBy.length === 0) {
                      finalSharedBy = [cleanedClaimedBy || currentUser?.id].filter(Boolean);
                    }
            
                    return {
                      ...item,
                      sharedBy: finalSharedBy,
                      claimedBy: cleanedClaimedBy,
                    };
                  })
                );
                
                // Also clean the current selection used in the buy modal
                setBuySharedBy(prev => {
                  const filtered = prev.filter(id => newParticipants.includes(id));
                  return filtered.length ? filtered : [currentUser?.id].filter(Boolean);
                });
                
                // Sync with backend via EventContext
                if (ctxUpdateParticipants && eventId) {
                  await ctxUpdateParticipants(eventId, newParticipants);
                }
                
                setParticipantsModalVisible(false);
                setTempParticipants([]);
              } catch (error) {
                console.error('[EventDetailScreen] Error removing participants:', error);
                Alert.alert(
                  'Error',
                  'Failed to remove participants. Please try again.',
                  [{ text: 'OK' }]
                );
                // Reset temp participants to current state on error
                const currentFriends = participants.filter(id => id !== currentUser?.id);
                setTempParticipants(currentFriends);
              }
            },
          },
        ]
      );
      return;
    }
    
    // No participants removed, proceed with update
    try {
      // Update participants state
      setParticipants(newParticipants);
      
      // Clean up all items so sharedBy/claimedBy never reference removed people
      setItems(currentItems =>
        currentItems.map(item => {
          const currentSharers = Array.isArray(item.sharedBy) ? item.sharedBy : [];
  
          // Keep only sharers that are still in the event
          const cleanedSharedBy = currentSharers.filter(id =>
            newParticipants.includes(id)
          );
  
          // If claimedBy has been removed, fall back to current user
          let cleanedClaimedBy = item.claimedBy;
          if (cleanedClaimedBy && !newParticipants.includes(cleanedClaimedBy)) {
            cleanedClaimedBy = currentUser?.id || null;
          }
          
          // If sharedBy becomes empty after cleaning and item is bought, 
          // default to the buyer (or current user if buyer was removed)
          let finalSharedBy = cleanedSharedBy;
          if (item.bought && finalSharedBy.length === 0) {
            finalSharedBy = [cleanedClaimedBy || currentUser?.id].filter(Boolean);
          }
  
          return {
            ...item,
            sharedBy: finalSharedBy,
            claimedBy: cleanedClaimedBy,
          };
        })
      );
      
      // Also clean the current selection used in the buy modal
      setBuySharedBy(prev => {
        const filtered = prev.filter(name => newParticipants.includes(name));
        return filtered.length ? filtered : [currentUser?.id].filter(Boolean);
      });
      
      // Sync with backend via EventContext
      if (ctxUpdateParticipants && eventId) {
        await ctxUpdateParticipants(eventId, newParticipants);
      }
      
      setParticipantsModalVisible(false);
      setTempParticipants([]);
    } catch (error) {
      console.error('[EventDetailScreen] Error updating participants:', error);
      Alert.alert(
        'Error',
        'Failed to update participants. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  

  // --- SPENDING DETAILS (for detailed modal) ---
  const getSpendingPerPerson = () => {
    const spending = {};
    participants.forEach(p => (spending[p] = 0));

    items
      .filter(item => item.bought && item.price && parseFloat(item.price) > 0)
      .forEach(item => {
        const price = parseFloat(item.price);
        let rawSharers =
          Array.isArray(item.sharedBy) && item.sharedBy.length > 0
            ? item.sharedBy
            : [item.claimedBy || currentUser?.id].filter(Boolean);
        
        // Filter sharers to only include current participants (sharedBy should contain IDs)
        const sharers = rawSharers.filter(id => participants.includes(id));
        
        // Skip items with no valid sharers
        if (sharers.length === 0) return;

        const perPerson = price / sharers.length;
        sharers.forEach(person => {
          if (participants.includes(person)) {
            spending[person] = (spending[person] || 0) + perPerson;
          }
        });
      });

    return spending;
  };

  // --- RENDER HELPERS ---

  const renderItemRow = (item, isActiveList) => (
    <View key={item.id} style={detailStyles.listItemRow}>
      {/* checkbox */}
      <TouchableOpacity
        onPress={() =>
          isReadOnly ? showArchivedAlert() : handleToggleBought(item)
        }
        style={{ justifyContent: 'center', alignItems: 'center' }}
      >
        {item.bought ? (
          <View style={[detailStyles.checkbox, detailStyles.checkboxChecked]}>
            <FontAwesome5 name="check" size={12} color={colors.background} />
          </View>
        ) : (
          <View style={detailStyles.checkbox} />
        )}
      </TouchableOpacity>

      {/* name */}
      <View style={{ flex: 1 }}>
        <Text
          style={[
            detailStyles.listItemText,
            item.bought && {
              textDecorationLine: 'line-through',
              color: '#aaa',
            },
          ]}
        >
          {item.name}
        </Text>
      </View>

      {/* right icons */}
      <View style={detailStyles.iconGroup}>
        {/* price for recent items */}
        {!isActiveList &&
          (editingPriceItemId === item.id ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  color: colors.text,
                  fontSize: 16,
                  marginRight: 2,
                }}
              >
                $
              </Text>
              <TextInput
                style={{
                  fontFamily: fonts.bold,
                  color: colors.text,
                  fontSize: 16,
                  minWidth: 50,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.accent,
                  paddingVertical: 2,
                }}
                value={editingPriceValue}
                onChangeText={handlePriceEditChange}
                keyboardType="decimal-pad"
                autoFocus
                onBlur={() => handleSavePrice(item.id)}
                onSubmitEditing={() => handleSavePrice(item.id)}
                placeholder="0.00"
                placeholderTextColor={colors.modalPlaceholder}
                editable={!isReadOnly}
                onFocus={isReadOnly ? showArchivedAlert : undefined}
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() =>
                isReadOnly ? showArchivedAlert() : handleEditPrice(item)
              }
            >
              <Text
                style={{
                  marginRight: 10,
                  fontFamily: fonts.bold,
                  color: colors.text,
                  fontSize: 16,
                }}
              >
                ${formatPrice(item.price)}
              </Text>
            </TouchableOpacity>
          ))}

        {/* active-list controls */}
        {isActiveList && (
          <>
            <TouchableOpacity
              onPress={() =>
                isReadOnly ? showArchivedAlert() : toggleItemUrgency(item.id)
              }
            >
              {item.urgent ? (
                <View style={detailStyles.urgentIcon}>
                  <Text style={detailStyles.exclamation}>!</Text>
                </View>
              ) : (
                <View
                  style={[
                    detailStyles.dashedCircle,
                    { borderColor: '#ccc', borderStyle: 'solid' },
                  ]}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                isReadOnly ? showArchivedAlert() : toggleItemClaim(item.id)
              }
            >
              {item.claimedBy ? (() => {
                const userColors = getUserColors(item.claimedBy);
                const userName = getUserNameFromId(item.claimedBy);
                return (
                  <View style={[detailStyles.avatarSmallSelected, { backgroundColor: userColors.backgroundColor }]}>
                    <Text style={[detailStyles.avatarTextSmall, { color: userColors.textColor }]}>
                      {getUserInitial(item.claimedBy, userName)}
                    </Text>
                  </View>
                );
              })() : (
                <View
                  style={[
                    detailStyles.dashedCircle,
                    { borderColor: '#ccc', borderStyle: 'solid' },
                  ]}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                isReadOnly ? showArchivedAlert() : openEditModal(item)
              }
            >
              <View style={detailStyles.editIconCircle}>
                <FontAwesome5 name="pen" size={12} color={colors.text} />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* buyer badge on recent list */}
        {!isActiveList && item.claimedBy && (() => {
          const userColors = getUserColors(item.claimedBy);
          const userName = getUserNameFromId(item.claimedBy);
          return (
            <View style={[detailStyles.avatarSmall, { backgroundColor: userColors.backgroundColor }]}>
              <Text style={[detailStyles.avatarTextSmall, { color: userColors.textColor }]}>
                {getUserInitial(item.claimedBy, userName)}
              </Text>
            </View>
          );
        })()}
      </View>
    </View>
  );

  const renderListTab = () => (
    <View style={detailStyles.listContainer}>
      {/* Hint Section */}
      {hintExpanded ? (
        <View style={detailStyles.hintContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <Text style={detailStyles.hintTitle}>Quick Tips</Text>
            <TouchableOpacity
              onPress={() => setHintExpanded(false)}
              style={detailStyles.hintToggleButton}
            >
              <FontAwesome5 name="chevron-up" size={14} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={detailStyles.hintRow}>
            <View style={detailStyles.hintIcon}>
              <Text style={detailStyles.exclamation}>!</Text>
            </View>
            <Text style={detailStyles.hintText}>
              <Text style={{ fontFamily: fonts.bold }}>Urgency:</Text> Tap the ! button to mark items as urgent (high priority)
            </Text>
          </View>
          
          <View style={detailStyles.hintRow}>
            <View style={detailStyles.hintIconDashed} />
            <Text style={detailStyles.hintText}>
              <Text style={{ fontFamily: fonts.bold }}>Claim:</Text> Tap the circle button to claim an item. Your initial will appear when claimed.
            </Text>
          </View>
          
          <View style={detailStyles.hintRow}>
            <View style={detailStyles.hintIconAI}>
              <FontAwesome5 name="magic" size={12} color={colors.text} />
            </View>
            <Text style={detailStyles.hintText}>
              <Text style={{ fontFamily: fonts.bold }}>AI Suggestions:</Text> Tap the wand button to get AI item suggestions based on your event.
            </Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setHintExpanded(true)}
          style={detailStyles.hintCollapsedContainer}
        >
          <FontAwesome5 name="question-circle" size={20} color={colors.accent} />
          <Text style={detailStyles.hintCollapsedText}>Tips</Text>
        </TouchableOpacity>
      )}

      {activeItems.map(item => renderItemRow(item, true))}

      {/* NEW ITEM ROW */}
      <View style={detailStyles.addItemRow}>
        <TextInput
          style={detailStyles.newItemInput}
          placeholder="New Item..."
          placeholderTextColor={colors.modalPlaceholder}
          value={newItemText}
          onChangeText={text =>
            isReadOnly ? showArchivedAlert() : setNewItemText(text)
          }
          onSubmitEditing={handleAddItem}
          editable={!isReadOnly}
          onFocus={isReadOnly ? showArchivedAlert : undefined}
        />
        <TouchableOpacity
          style={detailStyles.aiIconButton}
          onPress={() =>
            isReadOnly ? showArchivedAlert() : setAiModalVisible(true)
          }
        >
          <FontAwesome5 name="magic" size={14} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* RECENTLY BOUGHT HEADER */}
      <TouchableOpacity
        style={detailStyles.recentlyBoughtLink}
        onPress={() => setShowRecent(!showRecent)}
      >
        <Text style={detailStyles.linkText}>
          {`Recently Bought (${recentItems.length})`}
        </Text>
        <View
          style={[
            styles.triangleBase,
            showRecent ? styles.triangleDown : styles.triangleRight,
          ]}
        />
      </TouchableOpacity>

      {/* RECENTLY BOUGHT ITEMS WITH SIMPLE SECOND ROW */}
      {showRecent &&
        recentItems.map(item => {
          // Get sharers and filter to only include current participants
          let rawSharers =
            Array.isArray(item.sharedBy) && item.sharedBy.length > 0
              ? item.sharedBy
              : [item.claimedBy || currentUser?.id].filter(Boolean);
          
          // Filter sharers to only include current participants (sharedBy should contain IDs)
          const sharers = rawSharers.filter(id => participants.includes(id));

          return (
            <View key={item.id} style={{ marginBottom: 12 }}>
              {renderItemRow(item, false)}

              {/* purchased item shared by row */}
              <View
                style={[
                  detailStyles.sharedByInlineRow,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 4,
                  },
                ]}
              >
                <Text
                  style={[
                    detailStyles.sharedByLabelInline,
                    {
                      fontFamily: fonts.regular,
                      color: colors.text,
                      marginRight: 8,
                    },
                  ]}
                >
                  shared by
                </Text>

                {sharers.map((id, index) => {
                  const name = getUserNameFromId(id);
                  const userColors = getUserColors(id);
                  const uniqueKey = `${item.id}-${id}-${index}`;
                  return (
                    <View
                      key={uniqueKey}
                      style={[
                        detailStyles.avatarSmall,
                        { marginRight: 6, backgroundColor: userColors.backgroundColor }
                      ]}
                    >
                      <Text style={[detailStyles.avatarTextSmall, { color: userColors.textColor }]}>
                        {getUserInitial(id, name)}
                      </Text>
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={[detailStyles.shareEditButton, { marginLeft: 4 }]}
                  onPress={() => startEditSharedBy(item)}
                  activeOpacity={0.8}
                >
                  <FontAwesome5 name="pen" size={12} color={colors.text} />
                </TouchableOpacity>
              </View>

            </View>
          );
        })}

      <View style={{ height: 50 }} />
    </View>
  );

  // ---- SPLIT TAB ----
  const renderSplitTab = () => {
    const getInitial = name => {
      return name.charAt(0).toUpperCase();
    };
    
    // Debug: log balances and transactions
    console.log('[SplitTab] Balances:', splitData.balances);
    console.log('[SplitTab] Transactions:', splitData.transactions);
    console.log('[SplitTab] Total spent:', splitData.totalSpent);
    
    // If there are transactions, always show them
    if (splitData.transactions.length > 0) {
      // Show transactions below
    } else {
      // No transactions - check if we should show "all settled"
      const allBalancesSettled = Object.values(splitData.balances).every(
        bal => Math.abs(bal) < 0.01
      );
      const hasNoExpenses = parseFloat(splitData.totalSpent) === 0;
      
      if (allBalancesSettled || hasNoExpenses) {
      return (
        <View style={detailStyles.splitCenterContainer}>
          <Text
            style={[
              detailStyles.amountText,
              { marginBottom: 30, fontSize: 16 },
            ]}
          >
            Total Spent: ${splitData.totalSpent}
          </Text>
          <Text
            style={[
              detailStyles.amountText,
              { fontSize: 14, color: '#999', marginBottom: 30 },
            ]}
          >
            All settled up!
          </Text>
          <View style={detailStyles.splitButtonRow}>
            <TouchableOpacity
              style={detailStyles.detailedButton}
              onPress={() => setDetailedModalVisible(true)}
            >
              <Text style={detailStyles.detailedButtonText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={detailStyles.settleButton}
              onPress={() =>
                isReadOnly ? showArchivedAlert() : handleSettle()
              }
            >
              <Text style={detailStyles.settleButtonText}>Settle</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
      }
    }

    // Show transactions (or empty state if no transactions but balances aren't settled)
    return (
      <View style={detailStyles.splitCenterContainer}>
        <Text
          style={[
            detailStyles.amountText,
            { marginBottom: 30, fontSize: 16 },
          ]}
        >
          Total Spent: ${splitData.totalSpent}
        </Text>
        {splitData.transactions.map((t, index) => {
          const fromName = getUserNameFromId(t.from) || t.from;
          const toName = getUserNameFromId(t.to) || t.to;
          const fromColors = getUserColors(t.from);
          const toColors = getUserColors(t.to);
          return (
            <View key={index} style={detailStyles.splitRow}>
              <View style={[detailStyles.avatarMedium, { backgroundColor: fromColors.backgroundColor }]}>
                <Text style={[detailStyles.avatarTextMedium, { color: fromColors.textColor }]}>
                  {getUserInitial(t.from, fromName)}
                </Text>
              </View>
              <View style={detailStyles.arrowContainer}>
                <Text style={detailStyles.amountText}>${t.amount}</Text>
                <View style={detailStyles.arrowLine} />
                <View style={detailStyles.arrowHead} />
              </View>
              <View style={[detailStyles.avatarMedium, { backgroundColor: toColors.backgroundColor }]}>
                <Text style={[detailStyles.avatarTextMedium, { color: toColors.textColor }]}>
                  {getUserInitial(t.to, toName)}
                </Text>
              </View>
            </View>
          );
        })}
        <View style={[detailStyles.splitButtonRow, { marginTop: 30 }]}>
          <TouchableOpacity
            style={detailStyles.detailedButton}
            onPress={() => setDetailedModalVisible(true)}
          >
            <Text style={detailStyles.detailedButtonText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={detailStyles.settleButton}
            onPress={() =>
              isReadOnly ? showArchivedAlert() : handleSettle()
            }
          >
            <Text style={detailStyles.settleButtonText}>Settle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // effective friends for participants picker - show ALL friends (like AddEventModal)
  // This allows adding new participants to existing events
  const effectiveFriends = useMemo(() => {
    if (!contextFriends || contextFriends.length === 0) {
      // If no friends from backend, return empty array (shouldn't happen if backend is working)
      console.warn('[EventDetailScreen] No friends available from backend');
      return [];
    }
    
    // Return all friends, not just current participants (allows adding new participants)
    return contextFriends;
  }, [contextFriends]);

  // ---- RENDER ----
  return (
    <View style={globalStyles.container}>
      <View
        style={{
          height: Constants.statusBarHeight,
          backgroundColor: colors.background,
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* header */}
        <View style={detailStyles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={detailStyles.headerSide}
          >
            <FontAwesome5 name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={detailStyles.headerRight}>
            <Text style={detailStyles.titleText}>{eventTitle}</Text>
          </View>
        </View>

        {/* participants */}
        <View style={detailStyles.participantsRow}>
          <FontAwesome5
            name="users"
            size={16}
            color={colors.text}
            style={{ marginRight: 8 }}
          />
          {participants.map((participantId, index) => {
            const participantName = getUserNameFromId(participantId) || participantId;
            const userColors = getUserColors(participantId);
            return (
              <View
                key={index}
                style={[detailStyles.avatarSmall, { backgroundColor: userColors.backgroundColor }]}
              >
                <Text style={[detailStyles.avatarTextSmall, { color: userColors.textColor }]}>
                  {getUserInitial(participantId, participantName)}
                </Text>
              </View>
            );
          })}
          <TouchableOpacity
            style={detailStyles.addParticipant}
            onPress={isReadOnly ? showArchivedAlert : openParticipantsModal}
          >
            <FontAwesome5 name="pen" size={10} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* tabs */}
        <View style={detailStyles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab('List')}>
            <Text
              style={[
                detailStyles.tabText,
                activeTab === 'List'
                  ? detailStyles.tabActive
                  : detailStyles.tabInactive,
              ]}
            >
              The List.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Split')}
            style={{ marginLeft: 20 }}
          >
            <Text
              style={[
                detailStyles.tabText,
                activeTab === 'Split'
                  ? detailStyles.tabActive
                  : detailStyles.tabInactive,
              ]}
            >
              The Split.
            </Text>
          </TouchableOpacity>
        </View>
        <View style={detailStyles.divider} />

        {activeTab === 'List' ? renderListTab() : renderSplitTab()}
      </ScrollView>

      {/* BUY MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={buyModalVisible && !isReadOnly}
        onRequestClose={() => {
          setBuyModalVisible(false);
          setShareDropdownVisible(false);
        }}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={detailStyles.modalContainer}>
            <Text style={detailStyles.modalTitle}>
              Buying: {selectedItem?.name}
            </Text>

            <View style={detailStyles.priceInputRow}>
              <Text style={detailStyles.currencySymbol}>$</Text>
              <TextInput
                style={detailStyles.priceInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={priceInput}
                onChangeText={handlePriceInputChange}
                autoFocus
                placeholderTextColor={colors.modalPlaceholder}
              />
            </View>

            <Text style={detailStyles.sharedByLabel}>shared by</Text>

            <View>
              <View style={detailStyles.sharedByRow}>
                {buySharedBy.map(id => {
                  const name = getUserNameFromId(id);
                  const userColors = getUserColors(id);
                  return (
                    <View
                      key={id}
                      style={[detailStyles.avatarSmall, { marginRight: 6, backgroundColor: userColors.backgroundColor }]}
                    >
                      <Text style={[detailStyles.avatarTextSmall, { color: userColors.textColor }]}>
                        {getUserInitial(id, name)}
                      </Text>
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={detailStyles.shareEditButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    setShareDropdownVisible(visible => !visible)
                  }
                >
                  <FontAwesome5 name="pen" size={12} color={colors.text} />
                </TouchableOpacity>
              </View>

              {shareDropdownVisible && (
                <View style={detailStyles.shareDropdown}>
                  {participants.map(p => {
                    const isSelected = buySharedBy.includes(p);
                    const displayName = p === currentUser?.id ? (currentUser?.name || 'Me') : getUserNameFromId(p) || p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={detailStyles.shareDropdownItem}
                        onPress={() => toggleSharePersonInDropdown(p)}
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
                          {displayName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={detailStyles.modalActionRow}>
              <TouchableOpacity
                onPress={() => {
                  setBuyModalVisible(false);
                  setShareDropdownVisible(false);
                }}
                style={detailStyles.modalCloseBtn}
              >
                <FontAwesome5 name="times" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBuyConfirm}
                style={detailStyles.modalCheckBtn}
              >
                <FontAwesome5 name="check" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI SUGGESTION MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={aiModalVisible && !isReadOnly}
        onRequestClose={closeAiModal}
      >
        <TouchableWithoutFeedback onPress={closeAiModal}>
          <View style={globalStyles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={detailStyles.aiModalContainer}>
                  <TouchableOpacity
                    style={detailStyles.aiCloseButton}
                    onPress={closeAiModal}
                  >
                    <FontAwesome5 name="times" size={16} color="#fff" />
                  </TouchableOpacity>

                  <Text style={detailStyles.aiTitle}>
                    Describe your gathering
                  </Text>

                  <TextInput
                    style={detailStyles.aiDescriptionInput}
                    placeholder="e.g. Hotpot birthday for 6 friends, budget $80"
                    placeholderTextColor={colors.modalPlaceholder}
                    multiline
                    value={description}
                    onChangeText={setDescription}
                  />

                  <TouchableOpacity
                    style={detailStyles.aiButton}
                    onPress={handleGenerateSuggestions}
                    disabled={isGenerating}
                  >
                    <FontAwesome5 name="magic" size={14} color="#fff" />
                    <Text style={detailStyles.aiButtonText}>
                      {isGenerating ? 'Generating…' : 'Generate suggestions'}
                    </Text>
                  </TouchableOpacity>

                  {suggestions.length > 0 && (
                    <>
                      <ScrollView
                        style={detailStyles.aiSuggestionsScroll}
                        contentContainerStyle={{ paddingBottom: 8 }}
                        showsVerticalScrollIndicator
                        nestedScrollEnabled
                      >
                        {suggestions.map(s => (
                          <TouchableOpacity
                            key={s.id}
                            style={detailStyles.aiSuggestionRow}
                            onPress={() => toggleSuggestion(s.id)}
                          >
                            <View
                              style={[
                                detailStyles.aiCheckbox,
                                s.selected && detailStyles.aiCheckboxSelected,
                              ]}
                            >
                              {s.selected && (
                                <FontAwesome5 name="check" size={10} color="#fff" />
                              )}
                            </View>
                            <Text style={detailStyles.aiSuggestionText}>
                              {s.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      
                      <View style={detailStyles.aiModalFooterRow}>
                        <TouchableOpacity
                          style={detailStyles.aiAddButton}
                          onPress={addSelectedSuggestions}
                        >
                          <Text style={detailStyles.aiAddButtonText}>
                            Add selected to list
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* EDIT ITEM MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={editModalVisible && !isReadOnly}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={globalStyles.modalOverlay}
        >
          <View style={detailStyles.editModalContainer}>
            <Text style={detailStyles.modalTitle}>Edit item</Text>
            <TextInput
              style={detailStyles.aiDescriptionInput}
              value={editText}
              onChangeText={setEditText}
            />
            <View style={detailStyles.editModalActions}>
              <TouchableOpacity
                style={detailStyles.modalCloseBtn}
                onPress={handleDeleteItem}
              >
                <FontAwesome5 name="trash" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={detailStyles.modalCheckBtn}
                onPress={handleSaveEdit}
              >
                <FontAwesome5 name="check" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* PARTICIPANTS EDIT MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={participantsModalVisible && !isReadOnly}
        onRequestClose={cancelParticipantsSelection}
      >
        <TouchableWithoutFeedback onPress={cancelParticipantsSelection}>
          <View style={globalStyles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={detailStyles.friendsModalContainer}>
                <Text style={detailStyles.friendsModalTitle}>Select Friends</Text>

                <ScrollView
                  style={detailStyles.friendsListContainer}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {effectiveFriends.map(friend => {
                    const friendId = friend.id?.toLowerCase();
                    const isSelected = tempParticipants.some(p => p?.toLowerCase() === friendId);
                    return (
                      <TouchableOpacity
                        key={friendId}
                        style={[
                          detailStyles.friendItem,
                          isSelected && detailStyles.friendItemSelected,
                        ]}
                        onPress={() => toggleTempParticipant(friend.id)}
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
                          {friend.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={detailStyles.friendsModalButtonRow}>
                  <TouchableOpacity
                    style={detailStyles.modalCloseBtn}
                    onPress={cancelParticipantsSelection}
                  >
                    <FontAwesome5 name="times" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={detailStyles.modalCheckBtn}
                    onPress={confirmParticipantsSelection}
                  >
                    <FontAwesome5 name="check" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* SHARED-BY EDIT MODAL FOR RECENT ITEMS */}
      <Modal
        animationType="fade"
        transparent
        visible={sharedByModalVisible && !isReadOnly}
        onRequestClose={cancelEditSharedBy}
      >
        <TouchableWithoutFeedback onPress={cancelEditSharedBy}>
          <View style={globalStyles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={detailStyles.friendsModalContainer}>
                <Text style={detailStyles.friendsModalTitle}>
                  Who is sharing?
                </Text>

                <ScrollView
                  style={detailStyles.friendsListContainer}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {participants.map(p => {
                    const isSelected = sharedByDraft.includes(p);
                    const displayName = p === currentUser?.id ? (currentUser?.name || 'Me') : getUserNameFromId(p) || p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          detailStyles.friendItem,
                          isSelected && detailStyles.friendItemSelected,
                        ]}
                        onPress={() => toggleSharedByDraftPerson(p)}
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
                          {displayName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={detailStyles.friendsModalButtonRow}>
                  <TouchableOpacity
                    style={detailStyles.modalCloseBtn}
                    onPress={cancelEditSharedBy}
                  >
                    <FontAwesome5 name="times" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={detailStyles.modalCheckBtn}
                    onPress={confirmEditSharedBy}
                  >
                    <FontAwesome5 name="check" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* DETAILED SPENDING MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={detailedModalVisible}
        onRequestClose={() => setDetailedModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setDetailedModalVisible(false)}
        >
          <View style={globalStyles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={detailStyles.detailedModalContainer}>
                <Text style={detailStyles.friendsModalTitle}>
                  Spending Details
                </Text>

                <ScrollView
                  style={detailStyles.friendsListContainer}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {participants.map(personId => {
                    const spending = getSpendingPerPerson();
                    const amount = spending[personId] || 0;
                    const personName = getUserNameFromId(personId) || personId;
                    const userColors = getUserColors(personId);
                    
                    return (
                      <View
                        key={personId}
                        style={detailStyles.detailedItemRow}
                      >
                        <View style={[detailStyles.avatarMedium, { backgroundColor: userColors.backgroundColor }]}>
                          <Text style={[detailStyles.avatarTextMedium, { color: userColors.textColor }]}>
                            {getUserInitial(personId, personName)}
                          </Text>
                        </View>
                        <Text style={detailStyles.detailedPersonName}>
                          {personName}
                        </Text>
                        <Text style={detailStyles.detailedAmount}>
                          ${amount.toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={detailStyles.friendsModalButtonRow}>
                  <TouchableOpacity
                    style={detailStyles.modalCloseBtn}
                    onPress={() => setDetailedModalVisible(false)}
                  >
                    <FontAwesome5 name="times" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = {
  triangleBase: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    marginLeft: 10,
  },
  triangleDown: {
    borderTopWidth: 8,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderLeftWidth: 6,
    borderTopColor: colors.text,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  triangleRight: {
    borderTopWidth: 6,
    borderRightWidth: 0,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
  },
};

