import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';

import HomeScreen from './HomeScreen';
import StylesScreen from './StylesScreen';
import RealtimeDemoScreen from './RealtimeDemoScreen';

const Tab = createBottomTabNavigator();



export default function App() {
  // Put your laptop's LAN IP here (from `ipconfig getifaddr en0`)
  const SERVER_URL = 'http://http://10.0.0.162';

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerTitleAlign: 'center',
          tabBarActiveTintColor: '#e55347',
          tabBarInactiveTintColor: '#34495e',
          tabBarStyle: { backgroundColor: '#e8e5dc' },
          tabBarIcon: ({ color, size }) => {
            const map = { Home: 'home', Styles: 'palette', Realtime: 'bolt' };
            return <FontAwesome5 name={map[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Styles" component={StylesScreen} />
        <Tab.Screen
          name="Realtime"
          children={() => <RealtimeDemoScreen serverUrl={SERVER_URL} room="demo1" />}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}