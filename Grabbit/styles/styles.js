// styles.js
import { StyleSheet } from 'react-native';

export const colors = {
  background: '#e8e5dc', // Beige
  cardBg: '#f0ceb0',     // Tan
  text: '#34495e',       // Dark Blue/Grey
  accent: '#e55347',     // Red/Orange
  inputBg: '#d9d9d9',     // Light Grey
  placeholder: '#b89c86',     // Brownish
  popupBg: '#c4ae9a',     // Light Brown
};

export const fonts = {
  light: 'JosefinSans_300Light',
  regular: 'JosefinSans_400Regular',
  bold: 'JosefinSans_700Bold',
  lightItalic: 'JosefinSans_300Light_Italic',
  regularItalic: 'JosefinSans_400Regular_Italic',
  boldItalic: 'JosefinSans_700Bold_Italic',
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Shared Modal Overlay (Dark transparent background)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  // Simple row helper if needed globally
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});