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
});
