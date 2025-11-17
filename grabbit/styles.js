import { StyleSheet } from 'react-native';

export const colors = {
  background: '#e8e5dc', // Beige
  cardBg: '#f0ceb0',     // Tan
  text: '#34495e',       // Dark Blue/Grey
  accent: '#e55347',     // Red/Orange
  color5: '#d9d9d9',     // Light Grey
  color6: '#b89c86',     // Brownish
  color7: '#c4ae9a',     // Light Brown

  // --- NEW COLORS ---
  modalBg: '#f7e0c8',         // Light orange modal background
  modalInputBg: '#e8e5dc',   // Input background (same as main bg)
  modalPlaceholder: '#b89c86', // Placeholder text color (Brownish)
  modalCommentText: '#e55347', // "Comments" label color (Accent)
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20, 
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '800', // Fallback weight
    color: colors.text,
    // FontFamily is applied inline in HomeScreen.js
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
    paddingBottom: 20, // Reduced padding (was 100 for footer)
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.cardBg,
    width: '47%', // Changed back to 47% from 48%
    aspectRatio: 1, // This keeps the tile square
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    justifyContent: 'space-between', // Pushes title to top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '500', // Fallback weight
    color: colors.text,
    lineHeight: 28,
    // FontFamily is applied inline in HomeScreen.js
  },
  iconContainer: { // This style is no longer used, but harmless
    alignItems: 'flex-end',
  },

  // --- NEW MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContainer: {
    width: '90%',
    backgroundColor: colors.modalBg,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalLabel: {
    fontSize: 24,
    color: colors.modalPlaceholder,
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: colors.modalInputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  participantButton: {
    backgroundColor: colors.modalInputBg,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginLeft: 15,
  },
  participantButtonText: {
    fontSize: 18,
    color: colors.text,
  },
  participantAddButton: {
    backgroundColor: colors.modalInputBg,
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  modalCommentLabel: {
    fontSize: 20,
    color: colors.modalCommentText,
    marginBottom: 10,
  },
  commentsInput: {
    backgroundColor: colors.modalInputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    height: 100,
    textAlignVertical: 'top', // Ensures text starts at the top
    marginBottom: 25,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15, // Creates space between buttons
  },
  modalActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25, // Makes it a circle
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: colors.text, // Dark blue/grey
  },
  confirmButton: {
    backgroundColor: colors.accent, // Red/orange
  },
});