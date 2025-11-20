import React, { useState, useMemo, useEffect } from 'react';
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

const BASE_URL =
  Platform.OS === 'web' || Platform.OS === 'ios'
    ? 'http://localhost:4000'
    : 'http://10.0.2.2:4000';

export default function EventDetailScreen({ route, navigation }) {
  const { 
    eventId, 
    eventTitle, 
    isNew, 
    initialItems, 
    participants: initialParticipants,
    onUpdateItems,
    onUpdateParticipants
  } = route.params || { 
    eventId: null,
    eventTitle: "Unit 602", 
    isNew: false, 
    initialItems: null,
    participants: null,
    onUpdateItems: null,
    onUpdateParticipants: null
  };

  const [activeTab, setActiveTab] = useState('List'); 
  const [hasSettled, setHasSettled] = useState(false);
  
  // Input States
  const [newItemText, setNewItemText] = useState('');
  const [newItemUrgent, setNewItemUrgent] = useState(false); 

  // Modal States
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [showRecent, setShowRecent] = useState(true);
  const [editingPriceItemId, setEditingPriceItemId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState(''); 

  // Items state - initialize from route params (from data.json)
  const [items, setItems] = useState(() => {
    // Deep copy to avoid reference issues
    if (initialItems && Array.isArray(initialItems)) {
      return JSON.parse(JSON.stringify(initialItems));
    }
    return [];
  });

  // Participants state - initialize from route params or default
  const [participants, setParticipants] = useState(() => {
    return initialParticipants || (isNew ? ['Me'] : ['Me', 'A']);
  });

  // Sync items when route params change (e.g., when navigating back)
  useEffect(() => {
    if (initialItems !== undefined) {
      // Deep copy to avoid reference issues
      if (Array.isArray(initialItems)) {
        setItems(JSON.parse(JSON.stringify(initialItems)));
      } else {
        setItems([]);
      }
    }
  }, [initialItems]);

  // Sync participants when route params change
  useEffect(() => {
    if (initialParticipants !== undefined) {
      setParticipants(initialParticipants);
    }
  }, [initialParticipants]);

  // Persist items changes back to HomeScreen
  useEffect(() => {
    if (eventId && onUpdateItems) {
      onUpdateItems(eventId, items);
    }
  }, [items, eventId, onUpdateItems]);

  // Persist participants changes back to HomeScreen
  useEffect(() => {
    if (eventId && onUpdateParticipants) {
      onUpdateParticipants(eventId, participants);
    }
  }, [participants, eventId, onUpdateParticipants]);

  const activeItems = items.filter(item => !item.bought);
  const recentItems = items.filter(item => item.bought);

  // Calculate split finances - automatically updates when items or participants change
  const splitData = useMemo(() => {
    // Get all bought items with prices
    const boughtItems = items.filter(item => item.bought && item.price && parseFloat(item.price) > 0);
    
    // Calculate total spent by each participant
    const spentByPerson = {};
    participants.forEach(p => spentByPerson[p] = 0);
    
    boughtItems.forEach(item => {
      if (item.claimedBy && spentByPerson.hasOwnProperty(item.claimedBy)) {
        const price = parseFloat(item.price) || 0;
        spentByPerson[item.claimedBy] += price;
      }
    });
    
    // Calculate total spent
    const totalSpent = Object.values(spentByPerson).reduce((sum, amount) => sum + amount, 0);
    
    // Calculate average per person
    const averagePerPerson = participants.length > 0 ? totalSpent / participants.length : 0;
    
    // Calculate who owes whom
    const balances = {};
    participants.forEach(p => {
      balances[p] = spentByPerson[p] - averagePerPerson;
    });
    
    // Find who owes and who is owed
    const debts = [];
    const credits = [];
    
    participants.forEach(p => {
      if (balances[p] < -0.01) { // Owing (negative balance)
        debts.push({ person: p, amount: Math.abs(balances[p]) });
      } else if (balances[p] > 0.01) { // Owed (positive balance)
        credits.push({ person: p, amount: balances[p] });
      }
    });
    
    // Sort debts and credits by amount (largest first) for better matching
    debts.sort((a, b) => b.amount - a.amount);
    credits.sort((a, b) => b.amount - a.amount);
    
    // Match debts to credits
    const transactions = [];
    let debtIndex = 0;
    let creditIndex = 0;
    
    while (debtIndex < debts.length && creditIndex < credits.length) {
      const debt = debts[debtIndex];
      const credit = credits[creditIndex];
      
      const amount = Math.min(debt.amount, credit.amount);
      transactions.push({
        from: debt.person,
        to: credit.person,
        amount: amount.toFixed(2)
      });
      
      debt.amount -= amount;
      credit.amount -= amount;
      
      if (debt.amount < 0.01) debtIndex++;
      if (credit.amount < 0.01) creditIndex++;
    }
    
    return {
      totalSpent: totalSpent.toFixed(2),
      averagePerPerson: averagePerPerson.toFixed(2),
      transactions,
      balances
    };
  }, [items, participants]);

  // ---- AI suggestions ----
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const closeAiModal = () => {
    setAiModalVisible(false);
    setIsGenerating(false);
    // optional: clear fields between uses
    // setDescription('');
    // setSuggestions([]);
  };

  // ---- Edit item modal ----
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');

  // --- Logic ---

  const toggleItemUrgency = (id) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === id ? { ...item, urgent: !item.urgent } : item
      )
    );
  };

  const toggleItemClaim = (id) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === id 
          ? { ...item, claimedBy: item.claimedBy === 'Me' ? null : 'Me' } 
          : item
      )
    );
  };

  const handleSettle = () => {
    // Remove all bought items (clearing finances)
    setItems(currentItems => currentItems.filter(item => !item.bought));
    setHasSettled(true);
  };

  // Reset settled state when items are bought again
  useEffect(() => {
    const boughtItems = items.filter(item => item.bought && item.price && parseFloat(item.price) > 0);
    if (boughtItems.length > 0) {
      setHasSettled(false);
    }
  }, [items]);

  const handleAddItem = () => {
    if (newItemText.trim() === '') return;
    const newItem = {
      id: Date.now(),
      name: newItemText,
      urgent: newItemUrgent, 
      claimedBy: null,
      bought: false,
      price: null
    };
    setItems([...items, newItem]);
    setNewItemText('');
    setNewItemUrgent(false); 
  };

  // ---- Claim / un-claim via checkbox ----
  const handleToggleBought = (item) => {
    if (!item.bought) {
      // going from unbought -> bought: open price modal
      setSelectedItem(item);
      setPriceInput('');
      setBuyModalVisible(true);
    } else {
      // undo buy: move back to active list
      setItems((current) =>
        current.map((it) =>
          it.id === item.id
            ? { ...it, bought: false, price: null, claimedBy: null }
            : it
        )
      );
    }
  };

  const handlePriceInputChange = (text) => {
    // Only allow numbers and one decimal point
    const numericRegex = /^\d*\.?\d*$/;
    if (text === '' || numericRegex.test(text)) {
      setPriceInput(text);
    }
  };

  const handleEditPrice = (item) => {
    setEditingPriceItemId(item.id);
    setEditingPriceValue(item.price || '');
  };

  const handleSavePrice = (itemId) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? { ...item, price: editingPriceValue || null }
          : item
      )
    );
    setEditingPriceItemId(null);
    setEditingPriceValue('');
  };

  const handlePriceEditChange = (text) => {
    // Only allow numbers and one decimal point
    const numericRegex = /^\d*\.?\d*$/;
    if (text === '' || numericRegex.test(text)) {
      setEditingPriceValue(text);
    }
  };

  const handleBuyConfirm = () => {
    if (selectedItem) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                bought: true,
                price: priceInput,
                claimedBy: 'Me', // show profile bubble
              }
            : item
        )
      );
    }
    setBuyModalVisible(false);
    setPriceInput('');
    setSelectedItem(null);
  };

  // ---- Edit / delete item ----
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditText(item.name);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    setItems((current) =>
      current.map((it) =>
        it.id === editingItem.id ? { ...it, name: editText } : it
      )
    );
    setEditModalVisible(false);
    setEditingItem(null);
    setEditText('');
  };

  const handleDeleteItem = () => {
    if (!editingItem) return;
    setItems((current) => current.filter((it) => it.id !== editingItem.id));
    setEditModalVisible(false);
    setEditingItem(null);
    setEditText('');
  };

  const handleGenerateSuggestions = async () => {
    if (!description.trim()) return;  // don't call if empty
  
    try {
      setIsGenerating(true);
  
      const res = await fetch(`${BASE_URL}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,                 // use user input
          pastItems: items.map((it) => it.name),
        }),
      });
  
      if (!res.ok) throw new Error('Bad response');
  
      const data = await res.json(); // { suggestions: string[] }
  
      const mapped = (data.suggestions || []).map((name, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        name,
        selected: false,
      }));
  
      setSuggestions(mapped);
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn't fetch AI suggestions.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSuggestion = (id) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, selected: !s.selected } : s
      )
    );
  };

  const addSelectedSuggestions = () => {
    const selected = suggestions.filter((s) => s.selected);
    if (selected.length === 0) return;

    const newItems = selected.map((s) => ({
      id: Date.now() + Math.random(),
      name: s.name,
      urgent: false,
      claimedBy: null,
      bought: false,
      price: null,
    }));

    setItems((current) => [...current, ...newItems]);

    // reset selection & collapse list
    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: false })));
    setAiModalVisible(false);
  };

  // --- Render Helpers ---

  const renderItemRow = (item, isActiveList) => (
    <View key={item.id} style={detailStyles.listItemRow}>
      {/* Checkbox (claim / undo) */}
      <TouchableOpacity
        onPress={() => handleToggleBought(item)}
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

      {/* Name */}
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

      {/* Right-side icons */}
      <View style={detailStyles.iconGroup}>
        {/* Price for recent items - editable */}
        {!isActiveList && (
          editingPriceItemId === item.id ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
              <Text style={{ fontFamily: fonts.bold, color: colors.text, fontSize: 16, marginRight: 2 }}>$</Text>
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
                autoFocus={true}
                onBlur={() => handleSavePrice(item.id)}
                onSubmitEditing={() => handleSavePrice(item.id)}
                placeholder="0.00"
                placeholderTextColor={colors.modalPlaceholder}
              />
            </View>
          ) : (
            <TouchableOpacity onPress={() => handleEditPrice(item)}>
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
          )
        )}

        {/* Urgency + Claim + Edit only on active list */}
        {isActiveList && (
          <>
            <TouchableOpacity onPress={() => toggleItemUrgency(item.id)}>
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

            <TouchableOpacity onPress={() => toggleItemClaim(item.id)}>
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

            <TouchableOpacity onPress={() => openEditModal(item)}>
              <View style={detailStyles.editIconCircle}>
                <FontAwesome5 name="pen" size={12} color={colors.text} />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Avatar / claimed indicator 
            - Only show on Recently Bought list
            - No extra circle on active list
        */}
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
      {/* ACTIVE ITEMS */}
      {activeItems.map((item) => renderItemRow(item, true))}

      {/* ADD ITEM ROW */}
      <View style={detailStyles.addItemRow}>
        <View style={detailStyles.checkboxPlaceholder}>
          <View style={detailStyles.checkbox} />
        </View>
        <TextInput
          style={detailStyles.newItemInput}
          placeholder="New Item..."
          placeholderTextColor={colors.modalPlaceholder}
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleAddItem}
        />
        <View style={detailStyles.iconGroup}>
          {/* Urgent toggle */}
          <TouchableOpacity onPress={() => setNewItemUrgent(!newItemUrgent)}>
            {newItemUrgent ? (
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

          {/* AI icon button */}
          <TouchableOpacity
            style={detailStyles.aiIconButton}
            onPress={() => setAiModalVisible(true)}
          >
            <FontAwesome5 name="magic" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* RECENTLY BOUGHT TOGGLE */}
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

      {showRecent && recentItems.map((item) => renderItemRow(item, false))}

      <View style={{ height: 50 }} />
    </View>
  );

  const renderSplitTab = () => {
    // Get first letter of name for avatar
    const getInitial = (name) => name.charAt(0).toUpperCase();
    
    // If no transactions, show summary
    if (splitData.transactions.length === 0) {
      return (
        <View style={detailStyles.splitCenterContainer}>
          {parseFloat(splitData.totalSpent) === 0 ? (
            <>
              <Text style={[detailStyles.amountText, { fontSize: 14, color: '#999' }]}>
                {hasSettled ? 'All cleared up' : 'No items purchased yet'}
              </Text>
            </>
          ) : (
            <>
              <Text style={[detailStyles.amountText, { marginBottom: 20, fontSize: 16 }]}>
                Total Spent: ${splitData.totalSpent}
              </Text>
              <Text style={[detailStyles.amountText, { marginBottom: 20, fontSize: 14, color: colors.accent }]}>
                Average per person: ${splitData.averagePerPerson}
              </Text>
              <Text style={[detailStyles.amountText, { fontSize: 14, color: '#999' }]}>
                All settled up!
              </Text>
              <TouchableOpacity 
                style={[detailStyles.settleButton, { marginTop: 30 }]}
                onPress={handleSettle}
              >
                <Text style={detailStyles.settleButtonText}>Settle</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      );
    }
    
    // Render transactions
    return (
      <View style={detailStyles.splitCenterContainer}>
        <Text style={[detailStyles.amountText, { marginBottom: 30, fontSize: 16 }]}>
          Total Spent: ${splitData.totalSpent}
        </Text>
        {splitData.transactions.map((transaction, index) => (
          <View key={index} style={detailStyles.splitRow}>
            <View style={detailStyles.avatarMedium}>
              <Text style={detailStyles.avatarTextMedium}>
                {getInitial(transaction.from)}
              </Text>
            </View>
            <View style={detailStyles.arrowContainer}>
              <Text style={detailStyles.amountText}>${transaction.amount}</Text>
              <View style={detailStyles.arrowLine} />
              <View style={detailStyles.arrowHead} />
            </View>
            <View style={detailStyles.avatarMedium}>
              <Text style={detailStyles.avatarTextMedium}>
                {getInitial(transaction.to)}
              </Text>
            </View>
          </View>
        ))}
        <TouchableOpacity 
          style={[detailStyles.settleButton, { marginTop: 30 }]}
          onPress={handleSettle}
        >
          <Text style={detailStyles.settleButtonText}>Settle</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      {/* Status bar spacer */}
      <View
        style={{
          height: Constants.statusBarHeight,
          backgroundColor: colors.background,
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={detailStyles.headerRow}>
        {/* LEFT: Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={detailStyles.headerSide}>
          <FontAwesome5 name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* RIGHT: Title */}
        <View style={detailStyles.headerRight}>
          <Text style={detailStyles.titleText}>{eventTitle}</Text>
        </View>
      </View>

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
              style={participant === 'Me' ? detailStyles.avatarSmallSelected : detailStyles.avatarSmall}
            >
              <Text style={detailStyles.avatarTextSmall}>
                {participant === 'Me' ? 'Me' : participant.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
          <TouchableOpacity style={detailStyles.addParticipant}>
            <FontAwesome5 name="plus" size={10} color={colors.text} />
          </TouchableOpacity>
        </View>

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

      {/* ---- BUY MODAL ---- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={buyModalVisible}
        onRequestClose={() => setBuyModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                keyboardType="decimal-pad"
                value={priceInput}
                onChangeText={handlePriceInputChange}
                autoFocus={true}
                placeholderTextColor={colors.modalPlaceholder}
              />
            </View>

            <Text style={detailStyles.sharedByLabel}>shared by</Text>

            <View style={detailStyles.sharedByRow}>
              <View
                style={[detailStyles.avatarSmallSelected, { marginRight: 5 }]}
              >
                <Text style={detailStyles.avatarTextSmall}>Me</Text>
              </View>
              <View style={detailStyles.avatarSmall}>
                <Text style={detailStyles.avatarTextSmall}>A</Text>
              </View>
            </View>

            <View style={detailStyles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setBuyModalVisible(false)}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* ---- AI SUGGESTION MODAL ---- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={aiModalVisible}
        onRequestClose={closeAiModal}
      >
        <TouchableWithoutFeedback onPress={closeAiModal}>
          <View style={globalStyles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <TouchableWithoutFeedback onPress={() => { /* swallow taps inside card */ }}>
                <View style={detailStyles.aiModalContainer}>
                  {/* top-right close button */}
                  <TouchableOpacity
                    style={detailStyles.aiCloseButton}
                    onPress={closeAiModal}
                  >
                    <FontAwesome5 name="times" size={16} color="#fff" />
                  </TouchableOpacity>

                  <Text style={detailStyles.aiTitle}>Describe your gathering</Text>

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

                  {/* Suggestions + footer scroll INSIDE the card */}
                  {suggestions.length > 0 && (
                    <ScrollView
                      style={detailStyles.aiSuggestionsScroll}
                      contentContainerStyle={{ paddingBottom: 16 }}
                    >
                      {suggestions.map((s) => (
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
                          <Text style={detailStyles.aiSuggestionText}>{s.name}</Text>
                        </TouchableOpacity>
                      ))}

                      <View style={detailStyles.aiModalFooterRow}>
                        <TouchableOpacity
                          style={detailStyles.aiAddButton}
                          onPress={addSelectedSuggestions}
                        >
                          <Text style={detailStyles.aiAddButtonText}>Add selected to list</Text>
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


      {/* ---- EDIT ITEM MODAL ---- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
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