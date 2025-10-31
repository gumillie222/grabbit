import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useFonts } from '@expo-google-fonts/josefin-sans/useFonts';
import { JosefinSans_300Light } from '@expo-google-fonts/josefin-sans/300Light';
import { JosefinSans_400Regular } from '@expo-google-fonts/josefin-sans/400Regular';
import { JosefinSans_700Bold } from '@expo-google-fonts/josefin-sans/700Bold';
import { JosefinSans_300Light_Italic } from '@expo-google-fonts/josefin-sans/300Light_Italic';
import { JosefinSans_400Regular_Italic } from '@expo-google-fonts/josefin-sans/400Regular_Italic';
import { JosefinSans_700Bold_Italic } from '@expo-google-fonts/josefin-sans/700Bold_Italic';

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
});
