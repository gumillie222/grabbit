import { StyleSheet } from 'react-native';
import { colors, fonts } from './styles.js';

export const alertStyles = StyleSheet.create({
  // --- Alert Confirmation Modal Styles ---
  alertModalContainer: {
    width: '85%',
    backgroundColor: colors.background,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  alertModalTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 15,
  },
  alertModalMessage: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 25,
    lineHeight: 22,
  },
  alertModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  alertModalCancelBtn: {
    backgroundColor: '#5A6770',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertModalConfirmBtn: {
    backgroundColor: colors.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

