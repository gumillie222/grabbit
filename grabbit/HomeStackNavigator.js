import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './HomeScreen';
import EventDetailScreen from './EventDetailScreen';

const Stack = createNativeStackNavigator();

// This component is a Stack Navigator
export default function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Hides the stack's own header
      }}
    >
      {/* Screen 1: The list of cards */}
      <Stack.Screen name="HomeList" component={HomeScreen} />
      
      {/* Screen 2: The detail view */}
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}