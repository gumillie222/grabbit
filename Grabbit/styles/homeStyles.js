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
    flexWrap: 'wrap',
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
  
  // --- Modal Overlay Container ---
  modalOverlayContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalOverlayWithSuggestions: {
    justifyContent: 'flex-start',
    paddingTop: '32%',
  },
  // --- AI Suggestions Styles ---
  suggestionsOuterContainer: {
    position: 'absolute',
    top: '62%',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 1001,
    backgroundColor: 'transparent',
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionsHeaderText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.accent,
    marginLeft: 8,
    marginRight: 12,
    flex: 1,
  },
  connectionIndicatorIcon: {
    marginLeft: 8,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionItemBlock: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    alignSelf: 'flex-start',
  },
  suggestionItemBlockSelected: {
    backgroundColor: colors.accent,
  },
  suggestionItemText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
  },
  suggestionItemTextSelected: {
    color: colors.background,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.placeholder,
    fontStyle: 'italic',
  },
  
  // --- Friends Selection Modal Styles ---
  friendsModalContainer: {
    backgroundColor: colors.cardBg,
    width: '85%',
    maxHeight: '70%',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  friendsModalTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  friendsListContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: colors.inputBg,
  },
  friendItemSelected: {
    backgroundColor: colors.accent,
  },
  friendCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.text,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendCheckboxSelected: {
    backgroundColor: colors.background,
    borderColor: colors.background,
  },
  friendName: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  friendNameSelected: {
    color: colors.background,
    fontFamily: fonts.bold,
  },
  friendsModalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
});
