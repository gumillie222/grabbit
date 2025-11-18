import { StyleSheet } from 'react-native';
import { colors, fonts } from './styles';

export const detailStyles = StyleSheet.create({
  // --- Header Area ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    padding: 5,
    marginTop: 5,
  },
  titleContainer: {
    alignItems: 'flex-end',
    paddingLeft: 40, // Added margin/padding from the left side
  },
  titleText: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.accent,
    lineHeight: 34,
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
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    backgroundColor: '#DCD9CD', 
    marginRight: 15,
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: colors.text,
  },
  checkboxPlaceholder: {
    width: 22,
    height: 22,
    marginRight: 15,
  },
  listItemText: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
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
    paddingHorizontal: 15,
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
    marginTop: 40,
    marginBottom: 50,
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
  }
});