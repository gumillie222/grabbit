import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts, JosefinSans_700Bold, JosefinSans_400Regular } from '@expo-google-fonts/josefin-sans';
import { styles, colors } from './EventDetailStyles.js'; 

// Mock data for "The List"
const initialItems = [
  { id: 1, name: 'dish soap', urgent: false, claimedBy: null },
  { id: 2, name: 'paper towel', urgent: true, claimedBy: null },
  { id: 3, name: 'flower', urgent: true, claimedBy: 'A' },
];

export default function EventDetailScreen({ route, navigation }) {
  // Get the title passed from HomeScreen
  const { eventTitle } = route.params;

  const [items, setItems] = useState(initialItems);

  // Load the fonts (could be moved to App.js to load once)
  let [fontsLoaded] = useFonts({
    JosefinSans_700Bold,
    JosefinSans_400Regular,
  });

  if (!fontsLoaded) {
    return null; // Or a loading indicator
  }

  const toggleUrgent = (itemId) => {
    // In a real app, you'd update this in a database
    setItems(items.map(item => 
      item.id === itemId ? { ...item, urgent: !item.urgent } : item
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        
        {/* --- Sidebar --- */}
        <View style={styles.sidebar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={30} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarButton}>
            <FontAwesome5 name="shopping-basket" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sidebarButton, styles.sidebarButtonActive]}>
            <Ionicons name="checkmark-done" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarButton}>
            <FontAwesome5 name="dollar-sign" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* --- Content Area --- */}
        <View style={styles.contentArea}>
          <Text style={[styles.groupTitle, { fontFamily: 'JosefinSans_700Bold' }]}>{eventTitle}</Text>
          
          {/* Participants */}
          <View style={styles.participantsRow}>
            <FontAwesome5 name="users" size={20} color={colors.text} />
            <View style={[styles.participantChip, { backgroundColor: colors.chipBg }]}>
              <Text style={[styles.participantText, { fontFamily: 'JosefinSans_700Bold' }]}>Me</Text>
            </View>
            <View style={[styles.participantChip, { backgroundColor: colors.chipBg }]}>
              <Text style={[styles.participantText, { fontFamily: 'JosefinSans_700Bold' }]}>A</Text>
            </View>
            <TouchableOpacity style={styles.participantAddButton}>
              <FontAwesome5 name="plus" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.listTitle, { fontFamily: 'JosefinSans_700Bold' }]}>The List.</Text>
          <View style={styles.divider} />

          {/* List Header */}
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>urgent</Text>
            <Text style={styles.listHeaderText}>claim</Text>
          </View>
          
          {/* List Items */}
          <ScrollView>
            {items.map(item => (
              <View key={item.id} style={styles.listItem}>
                <FontAwesome5 name="square" size={24} color={colors.chipBg} />
                <Text style={[styles.listItemText, { fontFamily: 'JosefinSans_400Regular' }]}>{item.name}</Text>
                <FontAwesome5 name="ellipsis-h" size={16} color={colors.text} />
                <Switch
                  trackColor={{ false: colors.chipBg, true: colors.accent }}
                  thumbColor={colors.background}
                  ios_backgroundColor={colors.chipBg}
                  onValueChange={() => toggleUrgent(item.id)}
                  value={item.urgent}
                />
                {item.claimedBy ? (
                  <View style={styles.claimedChip}>
                    <Text style={[styles.participantText, { fontFamily: 'JosefinSans_700Bold' }]}>{item.claimedBy}</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.claimButton}>
                    <View style={styles.claimButtonCircle} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Add Button */}
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={40} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}