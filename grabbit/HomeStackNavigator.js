// HomeStackNavigator.js - Wraps home list + detail screens in a stack for nested navigation inside tabs
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
      <Stack.Screen name="HomeList" component={HomeScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}
