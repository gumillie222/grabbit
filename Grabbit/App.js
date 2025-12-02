import React, { useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
import ProfileScreen from './ProfileScreen';
import { EventProvider } from './EventContext';
import { AuthProvider, useAuth } from './AuthContext';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

const getTabBarVisibility = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const hideOnScreens = []; 
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
    <SafeAreaProvider>
      <AuthProvider>
        <EventProvider>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </View>
        </EventProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const { authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e8e5dc' }}>
        <ActivityIndicator size="large" color="#e55347" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#e55347',
        tabBarInactiveTintColor: '#34495e',
        tabBarStyle: { 
          backgroundColor: '#e8e5dc',
          display: getTabBarVisibility(route), 
        },
        tabBarIcon: ({ color, size }) => {
          const map = { Home: 'home', Me: 'user-alt', Realtime: 'bolt' };
          return <FontAwesome5 name={map[route.name]} size={size} color={color} />;
        },
        headerShown: route.name !== 'Home' && route.name !== 'Me',
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Me" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
