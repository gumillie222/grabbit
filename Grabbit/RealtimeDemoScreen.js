// RealtimeDemoScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRealtime } from './useRealtime';

const COLORS = {
  bg: '#e8e5dc',
  accent: '#e55347',
  chipOn: '#e55347',
  chipOff: '#d9d9d9',
};

const MEMBERS = ['Me', 'A', 'B']; // demo users

const BASE_URL =
  Platform.OS === 'web' || Platform.OS === 'ios'
    ? 'http://localhost:3000'
    : 'http://10.0.2.2:3000';


export default function RealtimeDemoScreen({ serverUrl, room = 'demo1' }) {
  const { connected, state, setState, send, latencyMs } = useRealtime(room, serverUrl);

  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState([]); // [{id, name, selected}]

  // unified item form (add + edit)
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = add, non-null = edit

  const [draftName, setDraftName] = useState('');
  const [draftComments, setDraftComments] = useState('');
  const [draftUrgent, setDraftUrgent] = useState(false);
  const [draftClaimed, setDraftClaimed] = useState(false);
  const [draftBought, setDraftBought] = useState(false);
  const [draftPrice, setDraftPrice] = useState('');
  const [draftSharedBy, setDraftSharedBy] = useState(['Me']);

  // modal for marking an existing item as bought (toggling chip on list)
  const [boughtModalOpen, setBoughtModalOpen] = useState(false);
  const [boughtItem, setBoughtItem] = useState(null);
  const [boughtPrice, setBoughtPrice] = useState('');
  const [boughtSharedBy, setBoughtSharedBy] = useState(['Me']);

  const resetDraft = () => {
    setDraftName('');
    setDraftComments('');
    setDraftUrgent(false);
    setDraftClaimed(false);
    setDraftBought(false);
    setDraftPrice('');
    setDraftSharedBy(['Me']);
  };

  const openNewItemForm = () => {
    setEditingItem(null);
    resetDraft();
    setItemFormOpen(true);
  };

  const openEditItemForm = (item) => {
    setEditingItem(item);
    setDraftName(item.name);
    setDraftComments(item.comments || '');
    setDraftUrgent(!!item.urgent);
    setDraftClaimed(!!item.claimed);
    setDraftBought(!!item.bought);
    setDraftPrice(item.bought ? String(item.price ?? '') : '');
    setDraftSharedBy(
      item.bought && item.sharedBy && item.sharedBy.length
        ? item.sharedBy
        : ['Me']
    );
    setItemFormOpen(true);
  };

  const closeItemForm = () => {
    setItemFormOpen(false);
    setEditingItem(null);
  };

  const submitItemForm = () => {
    if (!draftName.trim()) return;

    const priceNumber = draftBought ? Number(draftPrice) || 0 : 0;
    let items;

    if (editingItem) {
      // update existing item
      items = state.items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              name: draftName.trim(),
              comments: draftComments.trim(),
              urgent: draftUrgent,
              claimed: draftClaimed,
              bought: draftBought,
              price: priceNumber,
              sharedBy: draftBought ? draftSharedBy : [],
            }
          : it
      );
    } else {
      // add new item
      const newItem = {
        id: Math.random().toString(36).slice(2, 9),
        name: draftName.trim(),
        comments: draftComments.trim(),
        urgent: draftUrgent,
        claimed: draftClaimed,
        bought: draftBought,
        price: priceNumber,
        sharedBy: draftBought ? draftSharedBy : [],
      };
      items = [...state.items, newItem];
    }

    const next = { ...state, items };
    setState(next);
    send(next);
    closeItemForm();
  };

  const toggleDraftSharedBy = (who) => {
    setDraftSharedBy((prev) =>
      prev.includes(who) ? prev.filter((x) => x !== who) : [...prev, who]
    );
  };

  const clearAllItems = () => {
    const next = { ...state, items: [] };
    setState(next);
    send(next);
  };

  const removeItem = (id) => {
    const items = state.items.filter((it) => it.id !== id);
    const next = { ...state, items };
    setState(next);
    send(next);
  };

  const toggleItemFlag = (id, key) => {
    const target = state.items.find((it) => it.id === id);
    if (!target) return;

    if (key === 'bought') {
      if (!target.bought) {
        // open "mark as bought" modal
        setBoughtItem(target);
        setBoughtPrice('');
        setBoughtSharedBy(['Me']);
        setBoughtModalOpen(true);
        return;
      }
      // turning off bought
      const items = state.items.map((it) =>
        it.id === id ? { ...it, bought: false } : it
      );
      const next = { ...state, items };
      setState(next);
      send(next);
      return;
    }

    // urgent / claimed simple toggle
    const items = state.items.map((it) =>
      it.id === id ? { ...it, [key]: !it[key] } : it
    );
    const next = { ...state, items };
    setState(next);
    send(next);
  };

  const confirmBoughtForItem = () => {
    if (!boughtItem) return;
    const priceNumber = Number(boughtPrice) || 0;

    const items = state.items.map((it) =>
      it.id === boughtItem.id
        ? {
            ...it,
            bought: true,
            price: priceNumber,
            sharedBy: boughtSharedBy,
          }
        : it
    );
    const next = { ...state, items };
    setState(next);
    send(next);

    setBoughtModalOpen(false);
    setBoughtItem(null);
  };

  const cancelBoughtModal = () => {
    setBoughtModalOpen(false);
    setBoughtItem(null);
  };

  const toggleBoughtSharedBy = (who) => {
    setBoughtSharedBy((prev) =>
      prev.includes(who) ? prev.filter((x) => x !== who) : [...prev, who]
    );
  };

  // ----- AI suggestions -----
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSuggestions = async () => {
    if (!description.trim()) return;

    try {
      setIsGenerating(true);
      console.log('Calling AI suggestions at:', `${BASE_URL}/api/suggestions`);

      const res = await fetch(`${BASE_URL}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          pastItems: state.items.map((it) => it.name),
        }),
      });

      if (!res.ok) throw new Error('Bad response');

      const data = await res.json(); // { suggestions: string[] }

      const mapped = data.suggestions.map((name, idx) => ({
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
      id: Math.random().toString(36).slice(2, 9),
      name: s.name,
      comments: '',
      urgent: false,
      claimed: false,
      bought: false,
      price: 0,
      sharedBy: [],
    }));

    const items = [...state.items, ...newItems];
    const next = { ...state, items };
    setState(next);
    send(next);

    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: false })));
  };

  const setBudget = (txt) => {
    const next = {
      ...state,
      finances: { ...state.finances, budget: Number(txt) || 0 },
    };
    setState(next);
    send(next);
  };
  const setSpent = (txt) => {
    const next = {
      ...state,
      finances: { ...state.finances, spent: Number(txt) || 0 },
    };
    setState(next);
    send(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>
            Realtime List {connected ? '🟢' : '🔴'}{' '}
            {latencyMs != null ? `${latencyMs}ms` : ''}
          </Text>

          {/* Gathering description + AI suggestions */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Describe your gathering</Text>
            <TextInput
              placeholder="e.g. Hotpot birthday for 6 friends, budget $80"
              style={styles.descriptionInput}
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleGenerateSuggestions}
            >
              <FontAwesome5 name="magic" size={16} color="#fff" />
              <Text style={styles.buttonText}>Generate suggestions</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              This simulates an AI model that uses past trips + your description
              to propose items to start your list.
            </Text>
          </View>

          {suggestions.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Suggested items</Text>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.suggestionRow}
                  onPress={() => toggleSuggestion(s.id)}
                >
                  <FontAwesome5
                    name={s.selected ? 'check-square' : 'square'}
                    size={18}
                    color={s.selected ? COLORS.accent : '#444'}
                  />
                  <Text style={styles.suggestionText}>{s.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.button, { marginTop: 8 }]}
                onPress={addSelectedSuggestions}
              >
                <FontAwesome5 name="plus" size={16} color="#fff" />
                <Text style={styles.buttonText}>Add selected to list</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List items */}
          <View style={styles.sectionCard}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionTitle}>Shopping List </Text>
              <View style={styles.listHeaderActions}>
                {/* <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={clearAllItems}
                >
                  <FontAwesome5 name="trash" size={16} color="#34495e" />
                </TouchableOpacity> */}
                <TouchableOpacity
                  style={styles.headerIconButtonAccent}
                  onPress={openNewItemForm}
                >
                  <FontAwesome5 name="plus" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              style={{ alignSelf: 'stretch', marginTop: 8 }}
              scrollEnabled={false}
              data={state.items}
              keyExtractor={(it) => it.id}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {!!item.comments && (
                      <Text style={styles.itemComments}>{item.comments}</Text>
                    )}
                    {item.bought && (
                      <Text style={styles.itemMeta}>
                        ${item.price?.toFixed(2)} · shared by{' '}
                        {item.sharedBy.join(', ') || '—'}
                      </Text>
                    )}
                  </View>

                  <View style={styles.itemRightColumn}>
                    <View style={styles.toggleGroup}>
                      <ToggleChip
                        label="urgent"
                        active={item.urgent}
                        onPress={() => toggleItemFlag(item.id, 'urgent')}
                      />
                      <ToggleChip
                        label="claim"
                        active={item.claimed}
                        onPress={() => toggleItemFlag(item.id, 'claimed')}
                      />
                      <ToggleChip
                        label="bought"
                        active={item.bought}
                        onPress={() => toggleItemFlag(item.id, 'bought')}
                      />
                    </View>
                    <View style={styles.itemIconRow}>
                      <TouchableOpacity
                        onPress={() => openEditItemForm(item)}
                        style={styles.iconButtonSmall}
                      >
                        <FontAwesome5 name="pen" size={12} color="#34495e" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeItem(item.id)}
                        style={styles.iconButtonSmall}
                      >
                        <FontAwesome5 name="trash" size={12} color="#34495e" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>

        </View>
      </ScrollView>

      {/* Add/Edit item popup */}
      <Modal visible={itemFormOpen} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit item' : 'Add item'}
            </Text>

            <TextInput
              placeholder="Item name..."
              style={styles.modalInput}
              value={draftName}
              onChangeText={setDraftName}
            />

            <TextInput
              placeholder="Comments..."
              style={[styles.modalInput, { height: 60 }]}
              multiline
              value={draftComments}
              onChangeText={setDraftComments}
            />

            <Text style={styles.modalLabel}>Flags</Text>
            <View style={styles.modalToggleRow}>
              <ToggleChip
                label="urgent"
                active={draftUrgent}
                onPress={() => setDraftUrgent((v) => !v)}
              />
              <ToggleChip
                label="claim"
                active={draftClaimed}
                onPress={() => setDraftClaimed((v) => !v)}
              />
              <ToggleChip
                label="bought"
                active={draftBought}
                onPress={() => setDraftBought((v) => !v)}
              />
            </View>

            {draftBought && (
              <>
                <Text style={styles.modalLabel}>Price</Text>
                <TextInput
                  placeholder="$ 0.00"
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={draftPrice}
                  onChangeText={setDraftPrice}
                />

                <Text style={styles.modalLabel}>Shared by</Text>
                <View style={styles.modalToggleRow}>
                  {MEMBERS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.memberChip,
                        draftSharedBy.includes(m) && styles.memberChipOn,
                      ]}
                      onPress={() => toggleDraftSharedBy(m)}
                    >
                      <Text
                        style={[
                          styles.memberChipText,
                          draftSharedBy.includes(m) && { color: '#fff' },
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeItemForm}>
                <FontAwesome5 name="times" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.okBtn} onPress={submitItemForm}>
                <FontAwesome5 name="check" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Mark-as-bought popup for row toggle */}
      <Modal visible={boughtModalOpen} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Mark as bought{boughtItem ? `: ${boughtItem.name}` : ''}
            </Text>

            <Text style={styles.modalLabel}>Price</Text>
            <TextInput
              placeholder="$ 0.00"
              style={styles.modalInput}
              keyboardType="numeric"
              value={boughtPrice}
              onChangeText={setBoughtPrice}
            />

            <Text style={styles.modalLabel}>Shared by</Text>
            <View style={styles.modalToggleRow}>
              {MEMBERS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.memberChip,
                    boughtSharedBy.includes(m) && styles.memberChipOn,
                  ]}
                  onPress={() => toggleBoughtSharedBy(m)}
                >
                  <Text
                    style={[
                      styles.memberChipText,
                      boughtSharedBy.includes(m) && { color: '#fff' },
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelBoughtModal}>
                <FontAwesome5 name="times" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.okBtn} onPress={confirmBoughtForItem}>
                <FontAwesome5 name="check" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// --- AI stub ---
function suggestItemsForGathering(description) {
  const d = (description || '').toLowerCase();

  const base = ['paper plates', 'napkins', 'cups', 'cutlery', 'trash bags'];

  if (d.includes('hotpot') || d.includes('hot pot')) {
    return [
      ...base,
      'thinly sliced beef',
      'napa cabbage',
      'fish balls',
      'tofu',
      'noodles',
      'dipping sauces',
      'broth base',
      'mushrooms',
      'drinks',
    ];
  }

  if (d.includes('bbq') || d.includes('barbecue') || d.includes('grill')) {
    return [
      ...base,
      'burgers',
      'hot dog buns',
      'sausages',
      'veggie skewers',
      'condiments',
      'chips',
      'salad greens',
      'charcoal / propane',
      'drinks',
    ];
  }

  if (d.includes('movie')) {
    return [
      ...base,
      'popcorn',
      'chips',
      'candy',
      'soda',
      'sparkling water',
      'blankets',
    ];
  }

  if (d.includes('brunch')) {
    return [
      ...base,
      'bagels',
      'cream cheese',
      'eggs',
      'bacon / sausage',
      'fruit platter',
      'juice',
      'coffee',
      'milk / oat milk',
    ];
  }

  if (d.includes('study') || d.includes('group project') || d.includes('work session')) {
    return [
      ...base,
      'coffee',
      'tea',
      'cookies',
      'fruit',
      'notebooks',
      'sticky notes',
    ];
  }

  return [...base, 'chips', 'cookies', 'fruit', 'soda', 'sparkling water'];
}

// Small chip component for toggles
function ToggleChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: COLORS.chipOn },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          active && { color: '#fff' },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  descriptionInput: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  helperText: { fontSize: 12, color: '#555', marginTop: 6 },
  button: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  suggestionText: { fontSize: 14 },

  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8e5dc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconButtonAccent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#d9d9d9',
  },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemComments: { fontSize: 13, color: '#555', marginTop: 2 },
  itemMeta: { fontSize: 12, color: '#777', marginTop: 2 },

  itemRightColumn: {
    alignItems: 'flex-end',
  },
  toggleGroup: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.chipOff,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemIconRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  iconButtonSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e8e5dc',
    alignItems: 'center',
    justifyContent: 'center',
  },

  finances: {
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  numInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    padding: 8,
    minWidth: 90,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffe0c2',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    marginTop: 6,
  },
  modalLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  modalToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  memberChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b89c86',
    backgroundColor: '#f0ceb0',
  },
  memberChipOn: {
    backgroundColor: '#b89c86',
  },
  memberChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34495e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  okBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
