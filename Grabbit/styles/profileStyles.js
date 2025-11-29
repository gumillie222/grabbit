// profileStyles.js
import { StyleSheet } from 'react-native';
import { colors, fonts } from './styles'; 

export const profileStyles = StyleSheet.create({
  profileContainer: {
    flex: 1,
    backgroundColor: colors.background, 
    alignItems: 'center',
    paddingTop: 20,
  },
  topIcons: {
    flexDirection: 'column',
    position: 'absolute',
    top: 20,
    left: 20, 
    zIndex: 1, 
  },
  iconButton: {
    padding: 10,
    marginBottom: 10,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60, 
    backgroundColor: colors.placeholder, 
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 30,
  },
  avatarTextLarge: {
    fontSize: 50,
    fontFamily: fonts.bold,
    color: colors.text, 
  },
  userName: {
    fontSize: 28,
    fontFamily: fonts.bold, 
    color: colors.text, 
    marginBottom: 10,
  },
  userInfoText: {
    fontSize: 18,
    fontFamily: fonts.regular, 
    color: colors.text,
    marginBottom: 5,
  },
  

  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.tabBarBg, // Example color
    height: 70, // Standard height for tab bars
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },

  // Edit modal
  modalContainer: {
    width: '90%',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'left',
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 12,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: colors.text,
  },
  saveButton: {
    backgroundColor: colors.accent,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
