import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useFonts } from '@expo-google-fonts/josefin-sans/useFonts';
import { JosefinSans_300Light } from '@expo-google-fonts/josefin-sans/300Light';
import { JosefinSans_400Regular } from '@expo-google-fonts/josefin-sans/400Regular';
import { JosefinSans_700Bold } from '@expo-google-fonts/josefin-sans/700Bold';
import { JosefinSans_300Light_Italic } from '@expo-google-fonts/josefin-sans/300Light_Italic';
import { JosefinSans_400Regular_Italic } from '@expo-google-fonts/josefin-sans/400Regular_Italic';
import { JosefinSans_700Bold_Italic } from '@expo-google-fonts/josefin-sans/700Bold_Italic';

import { FontAwesome5 } from '@expo/vector-icons';

export default function App() {
  let [fontsLoaded] = useFonts({
    JosefinSans_300Light,
    JosefinSans_400Regular,
    JosefinSans_700Bold,
    JosefinSans_300Light_Italic,
    JosefinSans_400Regular_Italic,
    JosefinSans_700Bold_Italic,
  });
  
  if (!fontsLoaded) {
    return null; 
  }
  return (
    <View style={styles.container}>
      <Text>Hello World</Text>
      <StatusBar style="auto" />
      <Text style={styles.text1}>Josefin Sans Light</Text>
      <Text style={styles.text2}>Josefin Sans Regular</Text>
      <Text style={styles.text3}>Josefin Sans Bold</Text>
      <Text style={styles.text4}>Josefin Sans Light Italic</Text>
      <Text style={styles.text5}>Josefin Sans Regular Italic</Text>
      <Text style={styles.text6}>Josefin Sans Bold Italic</Text>

      <View style={styles.color1}></View>
      <View style={styles.color2}></View>
      <View style={styles.color3}></View>
      <View style={styles.color4}></View>
      <View style={styles.color5}></View>
      <View style={styles.color6}></View>

      <FontAwesome5 name="list-alt" size={24} color="black" />
      <FontAwesome5 name="user" size={24} color="black" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8e5dc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text1: {
    fontFamily: 'JosefinSans_300Light',
    fontSize: 20,
  },
  text2: {
    fontFamily: 'JosefinSans_400Regular',
    fontSize: 20,
  },
  text3: {
    fontFamily: 'JosefinSans_700Bold',
    fontSize: 20,
  },
  text4: {
    fontFamily: 'JosefinSans_300Light_Italic',
    fontSize: 20,
  },
  text5: {
    fontFamily: 'JosefinSans_400Regular_Italic',
    fontSize: 20,
  },
  text6: {
    fontFamily: 'JosefinSans_700Bold_Italic',
    fontSize: 20,
  },
  color1: {
    backgroundColor: '#f0ceb0',
    width: 40,
    height: 40,
  },
  color2: {
    backgroundColor: '#e55347',
    width: 40,
    height: 40,
  },
  color3: {
    backgroundColor: '#d9d9d9',
    width: 40,
    height: 40,
  },
  color4: {
    backgroundColor: '#b89c86',
    width: 40,
    height: 40,
  },
  color5: {
    backgroundColor: '#c4ae9a',
    width: 40,
    height: 40,
  },
  color6: {
    backgroundColor: '#34495e',
    width: 40,
    height: 40,
  },
});
