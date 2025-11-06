// RealtimeDemoScreen.js
import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRealtime } from './useRealtime';
import { FontAwesome5 } from '@expo/vector-icons';

const COLORS = {
  bg: '#e8e5dc',
  accent: '#e55347',
};

export default function RealtimeDemoScreen({ serverUrl, room = 'demo1' }) {
  const { connected, state, setState, send, latencyMs } = useRealtime(room, serverUrl);

  const addItem = (name, price = 0) => {
    if (!name) return;
    const id = Math.random().toString(36).slice(2, 9);
    const items = [...state.items, { id, name, status: 'todo', price }];
    const next = { ...state, items };
    setState(next);
    send(next);
  };

  const toggle = (id) => {
    const items = state.items.map((it) =>
      it.id === id ? { ...it, status: it.status === 'done' ? 'todo' : 'done' } : it
    );
    const next = { ...state, items };
    setState(next);
    send(next);
  };

  const setBudget = (txt) => {
    const next = { ...state, finances: { ...state.finances, budget: Number(txt) || 0 } };
    setState(next);
    send(next);
  };
  const setSpent = (txt) => {
    const next = { ...state, finances: { ...state.finances, spent: Number(txt) || 0 } };
    setState(next);
    send(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Realtime Demo {connected ? '🟢' : '🔴'} {latencyMs != null ? `${latencyMs}ms` : ''}
      </Text>

      <TextInput
        placeholder="Add item and press return"
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={(e) => addItem(e.nativeEvent.text)}
      />

      <FlatList
        style={{ alignSelf: 'stretch' }}
        data={state.items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggle(item.id)} style={styles.itemRow}>
            <FontAwesome5
              name={item.status === 'done' ? 'check-square' : 'square'}
              size={20}
              color="black"
            />
            <Text style={[styles.itemText, item.status === 'done' && styles.done]}>
              {item.name}
            </Text>
            <Text style={styles.price}>${item.price ?? 0}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.finances}>
        <Text style={styles.section}>Finances</Text>
        <View style={styles.row}>
          <Text>Budget: </Text>
          <TextInput
            style={styles.numInput}
            keyboardType="numeric"
            value={String(state.finances.budget)}
            onChangeText={setBudget}
          />
        </View>
        <View style={styles.row}>
          <Text>Spent: </Text>
          <TextInput
            style={styles.numInput}
            keyboardType="numeric"
            value={String(state.finances.spent)}
            onChangeText={setSpent}
          />
        </View>
        <Text>
          Remaining: $
          {Math.max(0, (state.finances.budget - state.finances.spent)).toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', padding: 16, gap: 10 },
  title: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#d9d9d9',
  },
  itemText: { fontSize: 16, flex: 1 },
  done: { textDecorationLine: 'line-through', color: '#888' },
  price: { fontVariant: ['tabular-nums'] },
  finances: {
    marginTop: 12,
    alignSelf: 'stretch',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  section: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  numInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    padding: 8,
    minWidth: 90,
  },
});