import React, { useState, useMemo, useEffect, useContext } from 'react';
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

import { globalStyles, colors, fonts } from './styles/styles.js';
import { detailStyles } from './styles/eventDetailStyles.js';
import { EventContext } from './EventContext';

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

  const [activeTab, setActiveTab] = useState('List');
  const [hasSettled, setHasSettled] = useState(false);

  const [newItemText, setNewItemText] = useState('');
  const [newItemUrgent, setNewItemUrgent] = useState(false);

  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [showRecent, setShowRecent] = useState(true);
  const [editingPriceItemId, setEditingPriceItemId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');

  // sharers when buying a new item
  const [buySharedBy, setBuySharedBy] = useState(['Me']);
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
    initialParticipants || (isNew ? ['Me'] : ['Me', 'A'])
  );

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

  // persist items
  useEffect(() => {
    if (isReadOnly) return;
    if (!eventId || !ctxUpdateItems) return;
    ctxUpdateItems(eventId, items);
  }, [items, eventId]);

  // persist participants
  useEffect(() => {
    if (isReadOnly) return;
    if (!eventId || !ctxUpdateParticipants) return;
    ctxUpdateParticipants(eventId, participants);
  }, [participants, eventId]);

  const activeItems = items.filter(i => !i.bought);
  const recentItems = items.filter(i => i.bought);

  // --- SPLIT LOGIC (uses sharedBy if present) ---
  const splitData = useMemo(() => {
    const balances = {};
    participants.forEach(p => (balances[p] = 0));

    const bought = items.filter(
      item => item.bought && item.price && parseFloat(item.price) > 0
    );
    const totalSpent = bought.reduce(
      (sum, item) => sum + parseFloat(item.price),
      0
    );

    bought.forEach(item => {
      const price = parseFloat(item.price);
      const sharers =
        Array.isArray(item.sharedBy) && item.sharedBy.length > 0
          ? item.sharedBy
          : [item.claimedBy ?? 'Me'];

      const buyer = item.claimedBy ?? 'Me';
      const perPerson = price / sharers.length;

      sharers.forEach(person => {
        if (person === buyer) return;
        balances[person] -= perPerson; // they owe
        balances[buyer] += perPerson; // buyer receives
      });
    });

    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([person, bal]) => {
      if (bal < -0.01) debtors.push({ person, amount: -bal });
      if (bal > 0.01) creditors.push({ person, amount: bal });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const amount = Math.min(debtor.amount, creditor.amount);

      transactions.push({
        from: debtor.person,
        to: creditor.person,
        amount: amount.toFixed(2),
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount <= 0.01) d++;
      if (creditor.amount <= 0.01) c++;
    }

    return { balances, transactions, totalSpent: totalSpent.toFixed(2) };
  }, [items, participants]);

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
          ? { ...item, claimedBy: item.claimedBy === 'Me' ? null : 'Me' }
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

  const toggleSharePersonInDropdown = name => {
    setBuySharedBy(prev => {
      const isSelected = prev.includes(name);
      let next = isSelected ? prev.filter(n => n !== name) : [...prev, name];
      if (next.length === 0) next = ['Me']; // never empty
      return next;
    });
  };

  const handleToggleBought = item => {
    if (isReadOnly) return showArchivedAlert();

    if (!item.bought) {
      setSelectedItem(item);
      setPriceInput('');
      setBuySharedBy([...participants]); // default share: everyone
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
        item.id === itemId ? { ...item, price: editingPriceValue || null } : item
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
                price: priceInput,
                claimedBy: 'Me',
                sharedBy: buySharedBy,
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
        : [item.claimedBy ?? 'Me'];
    setSharedByDraft(currentSharers);
    setSharedByEditItemId(item.id);
    setSharedByModalVisible(true);
  };

  const toggleSharedByDraftPerson = name => {
    setSharedByDraft(prev => {
      const isSelected = prev.includes(name);
      let next = isSelected ? prev.filter(n => n !== name) : [...prev, name];
      if (next.length === 0) next = ['Me'];
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
    const cleaned = sharedByDraft.length ? sharedByDraft : ['Me'];
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
    const currentFriends = participants.filter(name => name !== 'Me');
    setTempParticipants(currentFriends);
    setParticipantsModalVisible(true);
  };

  const toggleTempParticipant = name => {
    setTempParticipants(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const cancelParticipantsSelection = () => {
    setParticipantsModalVisible(false);
    setTempParticipants([]);
  };

  const confirmParticipantsSelection = () => {
    setParticipants(['Me', ...tempParticipants]);
    setParticipantsModalVisible(false);
  };

  // --- SPENDING DETAILS (for detailed modal) ---
  const getSpendingPerPerson = () => {
    const spending = {};
    participants.forEach(p => (spending[p] = 0));

    items
      .filter(item => item.bought && item.price && parseFloat(item.price) > 0)
      .forEach(item => {
        const price = parseFloat(item.price);
        const sharers =
          Array.isArray(item.sharedBy) && item.sharedBy.length > 0
            ? item.sharedBy
            : [item.claimedBy ?? 'Me'];

        const perPerson = price / sharers.length;
        sharers.forEach(person => {
          spending[person] = (spending[person] || 0) + perPerson;
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
                ${item.price || '0.00'}
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
              {item.claimedBy === 'Me' ? (
                <View style={detailStyles.avatarSmallSelected}>
                  <Text style={detailStyles.avatarTextSmall}>Me</Text>
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
        {!isActiveList && item.claimedBy === 'Me' && (
          <View style={detailStyles.avatarSmall}>
            <Text style={detailStyles.avatarTextSmall}>Me</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderListTab = () => (
    <View style={detailStyles.listContainer}>
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
          const sharers =
            Array.isArray(item.sharedBy) && item.sharedBy.length > 0
              ? item.sharedBy
              : [item.claimedBy ?? 'Me'];

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

                {sharers.map(name => (
                  <View
                    key={name}
                    style={
                      name === 'Me'
                        ? [detailStyles.avatarSmallSelected, { marginRight: 6 }]
                        : [detailStyles.avatarSmall, { marginRight: 6 }]
                    }
                  >
                    <Text style={detailStyles.avatarTextSmall}>
                      {name === 'Me' ? 'Me' : name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ))}

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
    const getInitial = name => name.charAt(0).toUpperCase();
    const allBalancesSettled = Object.values(splitData.balances).every(
      bal => Math.abs(bal) < 0.01
    );

    if (splitData.transactions.length === 0 && allBalancesSettled) {
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
        {splitData.transactions.map((t, index) => (
          <View key={index} style={detailStyles.splitRow}>
            <View style={detailStyles.avatarMedium}>
              <Text style={detailStyles.avatarTextMedium}>
                {getInitial(t.from)}
              </Text>
            </View>
            <View style={detailStyles.arrowContainer}>
              <Text style={detailStyles.amountText}>${t.amount}</Text>
              <View style={detailStyles.arrowLine} />
              <View style={detailStyles.arrowHead} />
            </View>
            <View style={detailStyles.avatarMedium}>
              <Text style={detailStyles.avatarTextMedium}>
                {getInitial(t.to)}
              </Text>
            </View>
          </View>
        ))}
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

  // effective friends for participants picker
  const effectiveFriends =
    contextFriends && contextFriends.length > 0
      ? contextFriends
      : participants
          .filter(name => name !== 'Me')
          .map(name => ({ id: name, name }));

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
          {participants.map((participant, index) => (
            <View
              key={index}
              style={
                participant === 'Me'
                  ? detailStyles.avatarSmallSelected
                  : detailStyles.avatarSmall
              }
            >
              <Text style={detailStyles.avatarTextSmall}>
                {participant === 'Me'
                  ? 'Me'
                  : participant.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
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
                {buySharedBy.map(name => (
                  <View
                    key={name}
                    style={
                      name === 'Me'
                        ? [detailStyles.avatarSmallSelected, { marginRight: 6 }]
                        : [detailStyles.avatarSmall, { marginRight: 6 }]
                    }
                  >
                    <Text style={detailStyles.avatarTextSmall}>
                      {name === 'Me' ? 'Me' : name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ))}

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
                          {p}
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
                    <ScrollView
                      style={detailStyles.aiSuggestionsScroll}
                      contentContainerStyle={{ paddingBottom: 16 }}
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
                          />
                          <Text style={detailStyles.aiSuggestionText}>
                            {s.name}
                          </Text>
                        </TouchableOpacity>
                      ))}

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
                    </ScrollView>
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
                    const name = friend.name;
                    const isSelected = tempParticipants.includes(name);
                    return (
                      <TouchableOpacity
                        key={friend.id ?? name}
                        style={[
                          detailStyles.friendItem,
                          isSelected && detailStyles.friendItemSelected,
                        ]}
                        onPress={() => toggleTempParticipant(name)}
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
                          {p}
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
                  {participants.map(person => {
                    const spending = getSpendingPerPerson();
                    const amount = spending[person] || 0;
                    return (
                      <View
                        key={person}
                        style={detailStyles.detailedItemRow}
                      >
                        <View style={detailStyles.avatarMedium}>
                          <Text style={detailStyles.avatarTextMedium}>
                            {person === 'Me'
                              ? 'Me'
                              : person.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={detailStyles.detailedPersonName}>
                          {person}
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

