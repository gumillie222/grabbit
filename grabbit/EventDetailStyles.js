import { StyleSheet } from 'react-native';

// These colors are from the new screenshot
export const colors = {
  background: '#EFEBE0',
  sidebar: '#D4C6B9',
  text: '#2C3E50',
  titleText: '#D35D4E',
  accent: '#D35D4E',
  chipBg: '#E8E5DC',
  divider: '#2C3E50',
  claimedChip: '#D9D9D9',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContent: {
    flexDirection: 'row',
    flex: 1,
  },
  // --- Sidebar ---
  sidebar: {
    width: 70,
    backgroundColor: colors.sidebar,
    paddingTop: 30,
    paddingHorizontal: 15,
    alignItems: 'center',
    gap: 25,
  },
  sidebarButton: {
    padding: 5,
  },
  sidebarButtonActive: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  // --- Content Area ---
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  groupTitle: {
    fontSize: 32,
    color: colors.titleText,
    marginBottom: 10,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  participantChip: {
    backgroundColor: colors.chipBg,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  participantText: {
    fontSize: 16,
    color: colors.text,
  },
  participantAddButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.chipBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 40,
    color: colors.text,
  },
  divider: {
    height: 2,
    backgroundColor: colors.divider,
    width: '100%',
    marginBottom: 10,
  },
  // --- List ---
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    gap: 30,
  },
  listHeaderText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
  },
  claimedChip: {
    width: 40,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.claimedChip,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5, // align with switch
  },
  claimButton: {
    width: 40,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  claimButtonCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text,
  },
  // --- Floating Add Button ---
  addButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});