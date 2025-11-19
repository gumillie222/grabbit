import { StyleSheet } from 'react-native';
import { colors, fonts } from './styles';

export const homeStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20, 
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 60,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.accent,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // --- CARD LAYOUT ---
  cardWrapper: {
    position: 'relative',
    width: '47%',
    marginBottom: 20,
  },
  
  card: {
    backgroundColor: colors.cardBg,
    width: '100%',
    height: 120,           // FIXED HEIGHT
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  cardTitle: {
    fontSize: 20,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'left',
    flexShrink: 1,        // prevent overflow
    flexWrap: 'wrap',     // allow full wrapping
  },

  deleteBubble: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.color6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  // --- Modal Styles ---
  modalContainer: {
    backgroundColor: colors.cardBg,
    width: '90%',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  modalCommentLabel: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.placeholder,
    marginBottom: 10,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  participantButton: {
    backgroundColor: colors.inputBg,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginLeft: 15,
  },
  participantButtonText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  participantAddButton: {
    backgroundColor: colors.inputBg,
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  commentsInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 25,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
  modalActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: colors.text, 
  },
  confirmButton: {
    backgroundColor: colors.accent,
  },
  suggestedText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.accent, 
    marginTop: 10,
    marginBottom: 10, 
    textAlign: 'left',
    paddingHorizontal: 20, 
  },
});
