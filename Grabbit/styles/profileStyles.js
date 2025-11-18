// profileStyles.js
import { StyleSheet } from 'react-native';
// Assuming you have a file that exports a 'colors' object and 'fonts' object
import { colors, fonts } from './styles'; 

export const profileStyles = StyleSheet.create({
  profileContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight, // Use a lighter background color
    alignItems: 'center',
    paddingTop: 20, // Adjust as needed for status bar / notch
  },
  topIcons: {
    flexDirection: 'column',
    position: 'absolute',
    top: 20, // Adjust to position from top of SafeAreaView
    left: 20, // Adjust to position from left of SafeAreaView
    zIndex: 1, // Ensure icons are above other content
  },
  iconButton: {
    padding: 10,
    marginBottom: 10, // Space between icons
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60, // Makes it a circle
    backgroundColor: colors.avatarBg, // Muted blue/grey for the avatar background
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80, // Space from the top icons and edge
    marginBottom: 30,
  },
  avatarTextLarge: {
    fontSize: 50,
    fontFamily: fonts.bold, // Assuming a bold font is available
    color: colors.avatarText, // Dark blue for 'Me' text
  },
  userName: {
    fontSize: 28,
    fontFamily: fonts.bold, // Assuming a bold font is available
    color: colors.userNameText, // Reddish color for the name
    marginBottom: 10,
  },
  userInfoText: {
    fontSize: 18,
    fontFamily: fonts.regular, // Assuming a regular font is available
    color: colors.userInfoText, // Darker text for phone/email
    marginBottom: 5,
  },
  // If you want to include the bottom navigation bar *within* this component
  // (which is usually handled by the Tab.Navigator itself, but if you need a visual placeholder)
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
