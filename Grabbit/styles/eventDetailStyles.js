import { StyleSheet } from 'react-native';
import { colors, fonts } from './styles';

export const detailStyles = StyleSheet.create({
  // --- Header Area ---
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 5,
  },

  headerSide: {
    width: 32, // keeps left/right edges symmetric
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },

  titleText: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.accent,
    lineHeight: 34,
    textAlign: 'right',
  },
  subTitleText: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.accent,
    lineHeight: 34,
  },
  
  // --- Participants ---
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', 
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 30,
    gap: 15, // Creates even space between all icons (Me, A, +)
  },

  addParticipant: {
    // Removed marginLeft (gap handles it now)
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Tabs ---
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Centers the tabs horizontally
    paddingHorizontal: 24,
    marginBottom: 15,
    gap: 40, 
  },
  tabText: {
    fontSize: 20,
    fontFamily: fonts.bold,
    paddingBottom: 5, 
  },
  tabActive: {
    color: colors.text,
    borderBottomWidth: 3,
    borderBottomColor: colors.accent, 
  },
  tabInactive: {
    color: '#c4ae9a', 
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
  },

  // --- List Section ---
  listContainer: {
    paddingHorizontal: 24,
  },
  hintContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  hintTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  hintToggleButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  hintCollapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  hintCollapsedText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hintIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  hintIconDashed: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    marginRight: 10,
  },
  hintIconAI: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  hintText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    backgroundColor: '#DCD9CD', 
    marginRight: 8,
    borderRadius: 4,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.text,
  },
  checkboxPlaceholder: {
    width: 22,
    height: 22,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemText: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  
  // --- New Item Input ---
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  newItemInput: {
    fontSize: 18,
    fontFamily: fonts.regularItalic, 
    color: colors.text,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.4)', 
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    borderRadius: 12,
  },

  // --- Icons & Avatars ---
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exclamation: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D6CFC4',
    justifyContent: 'center',
    alignItems: 'center',
    // Removed marginRight (gap handles it in iconGroup if needed, but usually list items use margins)
    // Note: In the main list item, we usually don't use gap because the text expands.
    // The detailStyles.listItemRow doesn't use gap, so we keep marginRight here if needed, 
    // BUT items inside iconGroup use gap.
  },
  avatarSmallSelected: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#A89F91', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: {
    fontSize: 12,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  dashedCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },

  // --- Footer ---
  recentlyBoughtLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  linkText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold,
    textDecorationLine: 'underline',
  },

  // --- Buy Modal Specifics ---
  modalContainer: { 
    width: '85%',
    backgroundColor: '#F2EFE9', 
    padding: 25,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 20,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0DCD0', 
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    width: 120,
  },
  currencySymbol: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.bold,
    marginRight: 5,
  },
  priceInput: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    width: '100%',
    padding: 0, 
  },
  sharedByLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.accent, 
    marginBottom: 8,
  },
  sharedByRow: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCloseBtn: {
    backgroundColor: '#5A6770', 
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCheckBtn: {
    backgroundColor: colors.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Split Tab ---
  splitCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  avatarMedium: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D6CFC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextMedium: {
    fontSize: 18, 
    fontFamily: fonts.bold, 
    color: colors.text
  },
  arrowContainer: {
    width: 120,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  amountText: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: fonts.bold,
    color: colors.text
  },
  arrowLine: {
    width: '100%',
    height: 2,
    backgroundColor: colors.accent,
  },
  arrowHead: {
     position: 'absolute',
     right: 0,
     bottom: -5,
     width: 0,
     height: 0,
     borderTopWidth: 6,
     borderTopColor: 'transparent',
     borderBottomWidth: 6,
     borderBottomColor: 'transparent',
     borderLeftWidth: 10,
     borderLeftColor: colors.accent,
  },
  splitButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  detailedButton: {
    backgroundColor: '#5A6770',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  detailedButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  settleButton: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  settleButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: fonts.bold,
  },

  // --- NEW: AI SUGGESTION LIST STYLES ---
  // small circle for edit icon
  editIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // AI modal container
  aiModalContainer: {
    width: 360,
    maxHeight: '50%',
    backgroundColor: '#F2EFE9',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  aiTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  aiDescriptionInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 10,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 6,
  },
  aiButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: fonts.bold,
    color: 'white',
  },
  aiHelperText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.modalPlaceholder,
    marginBottom: 10,
  },
  aiSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  aiSuggestionsScroll: {
    marginTop: 8,
    maxHeight: 250,
    flexGrow: 0,
  },
  aiCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.text,
    marginRight: 12,
  },
  aiCheckboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  aiSuggestionText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  aiModalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  aiAddButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  aiAddButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: 'white',
  },
  aiCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5A6770',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // edit item modal
  editModalContainer: {
    width: '85%',
    backgroundColor: '#F2EFE9',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },

  // --- Collaborators / Friends modal ---
  friendsModalContainer: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#F2EFE9',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  friendsModalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },

  friendsListContainer: {
    marginTop: 4,
  },

  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },

  friendItemSelected: {
    backgroundColor: '#FAD4C4',
  },

  friendCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  friendCheckboxSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },

  friendName: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },

  friendNameSelected: {
    fontFamily: fonts.bold,
  },

  friendsModalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },

  shareEditButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  shareDropdown: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F2EFE9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  
  shareDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  // --- Detailed Spending Modal ---
  detailedModalContainer: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#F2EFE9',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  detailedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  detailedPersonName: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: 12,
  },
  detailedAmount: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
});