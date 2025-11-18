import React, { useCallback } from 'react';
import { View } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { 
  useFonts,
  JosefinSans_300Light,
  JosefinSans_400Regular,
  JosefinSans_700Bold,
  JosefinSans_300Light_Italic,
  JosefinSans_400Regular_Italic,
  JosefinSans_700Bold_Italic 
} from '@expo-google-fonts/josefin-sans';

import HomeStackNavigator from './HomeStackNavigator'; 
import StylesScreen from './StylesScreen';
import RealtimeDemoScreen from './RealtimeDemoScreen';
import ProfileScreen from './ProfileScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

// 🔴 FIX APPLIED HERE: EventDetail is removed from hideOnScreens
const getTabBarVisibility = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const hideOnScreens = []; // Array is now empty
  // If you had other full-screen modals you wanted to hide the tab bar on, 
  // you would list them here, but EventDetail is no longer one of them.
  if (hideOnScreens.includes(routeName)) return 'none'; 
  return 'flex'; 
};

export default function App() {
  const SERVER_URL = 'http://10.0.0.162';

  let [fontsLoaded] = useFonts({
    JosefinSans_300Light,
    JosefinSans_400Regular,
    JosefinSans_700Bold,
    JosefinSans_300Light_Italic,
    JosefinSans_400Regular_Italic,
    JosefinSans_700Bold_Italic,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null; 

  return (
    // Wrap everything in SafeAreaProvider
    <SafeAreaProvider> 
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerTitleAlign: 'center',
              tabBarActiveTintColor: '#e55347',
              tabBarInactiveTintColor: '#34495e',
              tabBarStyle: { 
                backgroundColor: '#e8e5dc',
                // This function now returns 'flex' for EventDetail
                display: getTabBarVisibility(route), 
              },
              tabBarIcon: ({ color, size }) => {
                const map = { Home: 'home', Me: 'user', Realtime: 'bolt' };
                return <FontAwesome5 name={map[route.name]} size={size} color={color} />;
              },
              headerShown: route.name !== 'Home' && route.name !== 'Me',
            })}
          >
            <Tab.Screen name="Home" component={HomeStackNavigator} />
            <Tab.Screen name="Me" component={ProfileScreen} />
            <Tab.Screen
              name="Realtime"
              children={() => <RealtimeDemoScreen serverUrl={SERVER_URL} room="demo1" />}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}