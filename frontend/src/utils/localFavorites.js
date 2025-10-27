// Local Storage Favorites Management
// This provides a fallback when the backend favorites API is not available

const FAVORITES_STORAGE_KEY = 'favoriteProperties';

export const localFavoritesManager = {
  // Get all favorite property IDs from local storage
  getFavoriteIds: () => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    } catch (error) {
      console.error('Error reading favorites from localStorage:', error);
      return [];
    }
  },

  // Add a property to favorites
  addFavorite: (propertyId) => {
    try {
      const favorites = localFavoritesManager.getFavoriteIds();
      if (!favorites.includes(propertyId)) {
        favorites.push(propertyId);
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        return true;
      }
      return false; // Already exists
    } catch (error) {
      console.error('Error adding favorite to localStorage:', error);
      return false;
    }
  },

  // Remove a property from favorites
  removeFavorite: (propertyId) => {
    try {
      const favorites = localFavoritesManager.getFavoriteIds();
      const updatedFavorites = favorites.filter(id => id !== propertyId);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
      return true;
    } catch (error) {
      console.error('Error removing favorite from localStorage:', error);
      return false;
    }
  },

  // Check if a property is favorited
  isFavorite: (propertyId) => {
    try {
      const favorites = localFavoritesManager.getFavoriteIds();
      return favorites.includes(propertyId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  },

  // Get count of favorites
  getFavoriteCount: () => {
    try {
      return localFavoritesManager.getFavoriteIds().length;
    } catch (error) {
      console.error('Error getting favorite count:', error);
      return 0;
    }
  },

  // Clear all favorites
  clearFavorites: () => {
    try {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }
};

export default localFavoritesManager;