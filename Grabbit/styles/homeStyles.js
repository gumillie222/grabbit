import { StyleSheet } from 'react-native';
import { colors, fonts } from './styles';

export const homeStyles = StyleSheet.create({
  // ... (Header and Grid styles remain unchanged)
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
  card: {
    backgroundColor: colors.cardBg,
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 28,
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
    // The blue border/outline from the first image is removed to show the content of the second image.
  },
  
  // The 'Group Name' label is not present in the second image; we will use the input as the label.
  // The input background and border should match the orange modal background (or be a slight variant).
  modalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 20,
    fontWeight: 'bold', // Group Name is bold in the image
  },
  // The 'Group Name' text itself is not a separate label in the second image.
  // We'll keep modalLabel for the Comments section.
  modalCommentLabel: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.placeholder,
    marginBottom: 10,
  },
  
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  // Participant button background should be the same as the input field.
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
});