import { StyleSheet } from 'react-native';
import { colors, fonts } from './styles';

export const homeStyles = StyleSheet.create({
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
    fontFamily: fonts.bold, // Added Font
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
    fontFamily: fonts.regular, // Added Font
    color: colors.text,
    lineHeight: 28,
  },
  
  // --- Modal Styles ---
  modalContainer: {
    width: '90%',
    backgroundColor: colors.modalBg,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalLabel: {
    fontSize: 24,
    fontFamily: fonts.bold, // Added Font
    color: colors.modalPlaceholder,
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: colors.modalInputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    fontFamily: fonts.regular, // Added Font
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
    fontFamily: fonts.bold, // Added Font
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
    fontFamily: fonts.bold, // Added Font
    color: colors.modalCommentText,
    marginBottom: 10,
  },
  commentsInput: {
    backgroundColor: colors.modalInputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: fonts.regular, // Added Font
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
});