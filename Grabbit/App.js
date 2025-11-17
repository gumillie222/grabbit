import React from 'react';
import 'react-native-gesture-handler';
// Import 'getFocusedRouteNameFromRoute'
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';

// Import our new Stack Navigator
import HomeStackNavigator from './HomeStackNavigator'; 
// Import the other screens
import StylesScreen from './StylesScreen';
import RealtimeDemoScreen from './RealtimeDemoScreen';

const Tab = createBottomTabNavigator();

// This helper function checks the current screen in the stack
// and hides the tab bar if it's on the 'EventDetail' screen.
const getTabBarVisibility = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const hideOnScreens = ['EventDetail'];

  if (hideOnScreens.includes(routeName)) {
    return 'none'; // Hides tab bar
  }
  return 'flex'; // Shows tab bar
};

export default function App() {
  // Put your laptop's LAN IP here (from `ipconfig getifaddr en0`)
  const SERVER_URL = 'http://10.0.0.162'; // I removed the extra 'http://'

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerTitleAlign: 'center',
          tabBarActiveTintColor: '#e55347',
          tabBarInactiveTintColor: '#34495e',
          // Apply the visibility function
          tabBarStyle: { 
            backgroundColor: '#e8e5dc',
            display: getTabBarVisibility(route),
          },
          tabBarIcon: ({ color, size }) => {
            const map = { Home: 'home', Styles: 'palette', Realtime: 'bolt' };
            return <FontAwesome5 name={map[route.name]} size={size} color={color} />;
          },
          // Hide the tab navigator's header for the Home stack
          headerShown: route.name !== 'Home',
        })}
      >
        {/* Use the HomeStackNavigator here */}
        <Tab.Screen name="Home" component={HomeStackNavigator} />
        <Tab.Screen name="Styles" component={StylesScreen} />
        <Tab.Screen
          name="Realtime"
          children={() => <RealtimeDemoScreen serverUrl={SERVER_URL} room="demo1" />}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}