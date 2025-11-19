import React, { useState } from 'react';
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
} from 'react-native';
import Constants from 'expo-constants'; 
import { FontAwesome5 } from '@expo/vector-icons';

import { globalStyles, colors, fonts } from './styles/styles.js';
import { detailStyles } from './styles/eventDetailStyles.js';

const BASE_URL =
  Platform.OS === 'web' || Platform.OS === 'ios'
    ? 'http://localhost:3000'
    : 'http://10.0.2.2:3000';

export default function EventDetailScreen({ route, navigation }) {
  const { eventTitle, isNew } = route.params || { eventTitle: "Unit 602", isNew: false };

  const [activeTab, setActiveTab] = useState('List'); 
  
  // Input States
  const [newItemText, setNewItemText] = useState('');
  const [newItemUrgent, setNewItemUrgent] = useState(false); 

  // Modal States
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [showRecent, setShowRecent] = useState(true); 

  // If this is a new event, start with an empty list.
  // Otherwise, use default template items.
  const [items, setItems] = useState(
    isNew
      ? []
      : [
          { id: 1, name: 'dish soap',  urgent: true,  claimedBy: 'Me', bought: false, price: null },
          { id: 2, name: 'paper towel', urgent: false, claimedBy: null,  bought: false, price: null },
          { id: 3, name: 'flower',     urgent: true,  claimedBy: null,  bought: false, price: null },
          { id: 4, name: 'milk 2%',    urgent: true,  claimedBy: 'Me', bought: false, price: null },
        ]
  );

  const activeItems = items.filter(item => !item.bought);
  const recentItems = items.filter(item => item.bought);

  // ---- AI suggestions ----
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
        style={{ marginRight: 15 }}
      >
        <View
          style={[
            detailStyles.checkbox,
            item.bought && detailStyles.checkboxChecked,
          ]}
        />
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
        {/* Price for recent items */}
        {!isActiveList && item.price && (
          <Text
            style={{
              marginRight: 10,
              fontFamily: fonts.bold,
              color: colors.text,
              fontSize: 16,
            }}
          >
            ${item.price}
          </Text>
        )}

        {/* Urgency + Edit only on active list */}
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

            <TouchableOpacity onPress={() => openEditModal(item)}>
              <View style={detailStyles.editIconCircle}>
                <FontAwesome5 name="pen" size={12} color={colors.text} />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Avatar / claimed indicator */}
        {item.claimedBy === 'Me' ? (
          <View style={detailStyles.avatarSmall}>
            <Text style={detailStyles.avatarTextSmall}>Me</Text>
          </View>
        ) : (
          <View style={detailStyles.dashedCircle} />
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
        <View style={detailStyles.checkboxPlaceholder} />
        <TextInput
          style={detailStyles.newItemInput}
          placeholder="New Item..."
          placeholderTextColor={colors.modalPlaceholder}
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleAddItem}
        />
        <View style={[detailStyles.iconGroup, { marginLeft: 10 }]}>
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
          <View style={{ width: 28 }} />
        </View>
      </View>

      {/* AI SUGGESTIONS trigger (now opens modal) */}
      <TouchableOpacity
        style={detailStyles.recentlyBoughtLink}
        onPress={() => setAiModalVisible(true)}
      >
        <Text style={detailStyles.linkText}>AI Suggestions</Text>
        <View style={[styles.triangleBase, styles.triangleRight]} />
      </TouchableOpacity>

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
    <View style={globalStyles.container}>
      {/* Status bar spacer */}
      <View
        style={{
          height: Constants.statusBarHeight,
          backgroundColor: colors.background,
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={detailStyles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={detailStyles.backButton}
          >
            <FontAwesome5
              name="angle-double-left"
              size={24}
              color={colors.color6}
            />
          </TouchableOpacity>
        </View>

        <View style={detailStyles.titleContainer}>
          <Text style={detailStyles.titleText}>{eventTitle}</Text>
        </View>

        <View style={detailStyles.participantsRow}>
          <FontAwesome5
            name="users"
            size={16}
            color={colors.text}
            style={{ marginRight: 8 }}
          />
          <View style={detailStyles.avatarSmallSelected}>
            <Text style={detailStyles.avatarTextSmall}>Me</Text>
          </View>
          {!isNew && (
            <View style={detailStyles.avatarSmall}>
              <Text style={detailStyles.avatarTextSmall}>A</Text>
            </View>
          )}
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
                keyboardType="numeric"
                value={priceInput}
                onChangeText={setPriceInput}
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
        onRequestClose={() => setAiModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={globalStyles.modalOverlay}
        >
          <View style={detailStyles.aiModalContainer}>
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

            <Text style={detailStyles.aiHelperText}>
              This simulates an AI model that uses past trips + your description
              to propose items to start your list.
            </Text>

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
                style={detailStyles.modalCloseBtn}
                onPress={() => setAiModalVisible(false)}
              >
                <FontAwesome5 name="times" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={detailStyles.aiAddButton}
                onPress={addSelectedSuggestions}
              >
                <Text style={detailStyles.aiAddButtonText}>
                  Add selected to list
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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