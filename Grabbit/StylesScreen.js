// StylesScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts,
  JosefinSans_300Light,
  JosefinSans_400Regular,
  JosefinSans_700Bold,
  JosefinSans_300Light_Italic,
  JosefinSans_400Regular_Italic,
  JosefinSans_700Bold_Italic
} from '@expo-google-fonts/josefin-sans';

const swatches = ['#e8e5dc','#f0ceb0','#e55347','#d9d9d9','#b89c86','#c4ae9a','#34495e'];

export default function StylesScreen() {
  const [loaded] = useFonts({
    JosefinSans_300Light,
    JosefinSans_400Regular,
    JosefinSans_700Bold,
    JosefinSans_300Light_Italic,
    JosefinSans_400Regular_Italic,
    JosefinSans_700Bold_Italic,
  });
  if (!loaded) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Style Guide</Text>

      <View style={styles.row}>
        {swatches.map((c) => <View key={c} style={[styles.swatch, {backgroundColor: c}]} />)}
      </View>

      <Text style={[styles.font, {fontFamily:'JosefinSans_300Light'}]}>Josefin Sans Light</Text>
      <Text style={[styles.font, {fontFamily:'JosefinSans_400Regular'}]}>Josefin Sans Regular</Text>
      <Text style={[styles.font, {fontFamily:'JosefinSans_700Bold'}]}>Josefin Sans Bold</Text>
      <Text style={[styles.font, {fontFamily:'JosefinSans_300Light_Italic'}]}>Light Italic</Text>
      <Text style={[styles.font, {fontFamily:'JosefinSans_400Regular_Italic'}]}>Regular Italic</Text>
      <Text style={[styles.font, {fontFamily:'JosefinSans_700Bold_Italic'}]}>Bold Italic</Text>

      <View style={styles.icons}>
        <FontAwesome5 name="list-alt" size={24} />
        <FontAwesome5 name="user" size={24} />
        <FontAwesome5 name="shopping-cart" size={24} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor:'#e8e5dc', padding:16 },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 12, alignSelf: 'center' },
  row: { flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center', marginBottom:12 },
  swatch: { width:40, height:40, borderRadius:6, borderWidth:1, borderColor:'#d9d9d9' },
  font: { fontSize:18, marginVertical:2, textAlign:'center' },
  icons: { marginTop:12, flexDirection:'row', gap:16, justifyContent:'center' },
});