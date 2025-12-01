// styles/profileStyles.js
import { StyleSheet } from 'react-native';
import { colors, fonts } from './styles';

export const profileStyles = StyleSheet.create({
  /* -------- Core profile layout -------- */
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

  /* -------- Avatar + name -------- */
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

  /* -------- Bottom nav (if used) -------- */
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.tabBarBg,
    height: 70,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },

  /* -------- Edit profile modal -------- */
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

  /* Settings modal */
  settingsContainer: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#f2efe9',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingsTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  settingsSubtitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  settingsBody: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 22,
  },
  settingsList: {
    marginTop: 4,
    marginBottom: 6,
  },
  settingsBullet: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 22,
  },
  settingsFooter: {
    marginTop: 14,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#777',
  },

  /* ===================== moved localStyles starts here ===================== */

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tabButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d0c9bd',
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  /* Cards */
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#777',
    marginBottom: 10,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#888',
  },

  /* Friends list */
  addFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: '#f5f2eb',
    paddingHorizontal: 10,
  },
  addFriendIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addFriendTitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    fontWeight: '600',
    color: colors.text,
  },
  addFriendSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#777',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  friendAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#d0ac8c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  friendAvatarText: {
    fontFamily: fonts.regular,
    color: '#fff',
    fontWeight: '700',
  },
  friendName: {
    fontSize: 16,
    fontFamily: fonts.regular,
    fontWeight: '600',
    color: colors.text,
  },
  friendSubText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#777',
  },

  /* Archive cards */
  archiveCardWrapper: {
    marginBottom: 10,
  },
  archiveCard: {
    backgroundColor: '#f7e0c5',
    borderRadius: 16,
    padding: 12,
    paddingTop: 16,
  },
  archiveTitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  archiveSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#6e6e6e',
  },
  unarchiveBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Archived detail modal */
  archiveDetailContainer: {
    width: '88%',
    maxHeight: '80%',
    backgroundColor: '#f2efe9',
    borderRadius: 20,
    padding: 16,
  },
  archiveDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  archiveDetailTitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  archiveDetailSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  archiveDetailLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  chip: {
    backgroundColor: '#e0d2c0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
    marginRight: 8,
  },
  itemText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  itemSubText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#777',
  },
  archiveBanner: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#aa5a4a',
  },

  /* Friend modal */
  friendModalContainer: {
    width: '88%',
    maxHeight: '75%',
    backgroundColor: '#f2efe9',
    borderRadius: 20,
    padding: 16,
  },
  friendModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  friendModalTitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    fontWeight: '600',
    color: colors.text,
  },
  friendModalTabRow: {
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: '#e6dfd2',
    padding: 3,
    marginBottom: 10,
  },
  friendModalTabButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendModalTabActive: {
    backgroundColor: '#fff',
  },
  friendModalTabText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: '#6b5b4b',
  },
  friendModalTabTextActive: {
    fontWeight: '600',
    color: colors.text,
  },
  friendModalHint: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#777',
    marginBottom: 6,
  },
  friendModalInput: {
    backgroundColor: '#f5f2eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: fonts.regular,
    marginBottom: 8,
    color: colors.text,
  },
  friendModalPrimaryButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  friendModalPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.regular,
    fontWeight: '600',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  requestAccept: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDecline: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d9534f',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
