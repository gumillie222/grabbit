// Utility to get consistent colors for each user
// Each user ID gets the same background and text color everywhere

const USER_COLORS = {
  'alice': {
    backgroundColor: '#A89F91', // Darker beige
    textColor: '#FFFFFF', // White text
  },
  'bob': {
    backgroundColor: '#D6CFC4', // Lighter beige
    textColor: '#34495e', // Dark text
  },
  // Default fallback for unknown users
  'default': {
    backgroundColor: '#c4ae9a', // Medium brown
    textColor: '#FFFFFF', // White text
  },
};

/**
 * Get consistent colors for a user based on their ID
 * @param {string} userId - The user ID (e.g., 'alice', 'bob')
 * @returns {Object} { backgroundColor, textColor }
 */
export const getUserColors = (userId) => {
  if (!userId) return USER_COLORS.default;
  
  const normalizedId = userId.toLowerCase();
  return USER_COLORS[normalizedId] || USER_COLORS.default;
};

/**
 * Get the initial/letter for a user
 * @param {string} userId - The user ID
 * @param {string} userName - Optional user name (used if userId is not recognized)
 * @returns {string} Single uppercase letter
 */
export const getUserInitial = (userId, userName = null) => {
  if (!userId && !userName) return '?';
  
  // If we have a known user ID, use their name
  const normalizedId = userId?.toLowerCase();
  if (normalizedId === 'alice') return 'A';
  if (normalizedId === 'bob') return 'B';
  
  // Otherwise use the first letter of the name or ID
  const nameToUse = userName || userId;
  return nameToUse?.charAt(0)?.toUpperCase() || '?';
};

