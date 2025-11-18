import { StyleSheet } from 'react-native';
import { colors, fonts } from './styles';

export const detailStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 5,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  titleText: {
    fontSize: 24,
    fontFamily: fonts.bold, // Added Font
    color: colors.accent,
  },
  subTitleText: {
    fontSize: 24,
    fontFamily: fonts.bold, // Added Font
    color: colors.accent,
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addParticipant: {
    marginLeft: 8,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    marginBottom: 5,
  },
  tabText: {
    fontSize: 18,
    fontFamily: fonts.bold, // Added Font
  },
  tabActive: {
    color: colors.text,
    textDecorationLine: 'underline',
  },
  tabInactive: {
    color: colors.color6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 20,
    marginBottom: 20,
  },

  // List Section
  listContainer: {
    paddingHorizontal: 40,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    backgroundColor: colors.modalInputBg,
    marginRight: 15,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.text,
  },
  checkboxPlaceholder: {
    width: 20,
    height: 20,
    marginRight: 15,
  },
  listItemText: {
    fontSize: 16,
    fontFamily: fonts.regular, // Added Font
    color: colors.text,
    flex: 1,
  },
  newItemInput: {
    fontSize: 16,
    fontFamily: fonts.regular, // Added Font
    color: colors.text,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 5
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },

  // Icons & Avatars
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgentIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  exclamation: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.modalInputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  avatarSmallSelected: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.color6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  avatarTextSmall: {
    fontSize: 10,
    color: colors.text,
    fontWeight: 'bold'
  },
  dashedCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    marginRight: 5,
  },

  // Footer
  recentlyBoughtLink: {
    marginTop: 20,
    marginBottom: 50,
  },
  linkText: {
    color: '#5C6B73',
    fontSize: 14,
    fontFamily: fonts.bold, // Added Font
    textDecorationLine: 'underline',
  },

  // Buy Modal Specifics
  modalContainer: { 
    width: '80%',
    backgroundColor: '#FDFBF6',
    padding: 25,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.bold, // Added Font
    color: colors.text,
    marginBottom: 15,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
    width: 100,
  },
  currencySymbol: {
    fontSize: 20,
    color: colors.text,
    marginRight: 5,
  },
  priceInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    width: '100%',
  },
  sharedByLabel: {
    fontSize: 12,
    fontFamily: fonts.regular, // Added Font
    color: colors.color6,
    marginBottom: 8,
  },
  sharedByRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseBtn: {
    backgroundColor: colors.text,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalCheckBtn: {
    backgroundColor: colors.accent,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Split Tab
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
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.modalInputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextMedium: {
    fontSize: 16, 
    fontWeight: 'bold', 
    color: colors.text
  },
  arrowContainer: {
    width: 100,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  amountText: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: 'bold',
    color: colors.text
  },
  arrowLine: {
    width: '100%',
    height: 1,
    backgroundColor: colors.accent,
  },
  arrowHead: {
     position: 'absolute',
     right: 0,
     bottom: -4,
     width: 0,
     height: 0,
     borderTopWidth: 4,
     borderTopColor: 'transparent',
     borderBottomWidth: 4,
     borderBottomColor: 'transparent',
     borderLeftWidth: 8,
     borderLeftColor: colors.accent,
  },
  settleButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  settleButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.bold, // Added Font
  }
});