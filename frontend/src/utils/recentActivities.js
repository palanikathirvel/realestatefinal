// Utility for managing recent activities in localStorage
const ACTIVITIES_STORAGE_KEY = 'userRecentActivities';
const MAX_ACTIVITIES = 20; // Keep only the latest 20 activities

export const activityTypes = {
  VIEWED_CONTACT: 'viewed_contact',
  SAVED_PROPERTY: 'saved_property',
  REMOVED_FAVORITE: 'removed_favorite',
  VIEWED_PROPERTY: 'viewed_property'
};

export const activityManager = {
  // Get all activities from localStorage
  getActivities: () => {
    try {
      const activities = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
      return activities ? JSON.parse(activities) : [];
    } catch (error) {
      console.error('Error getting activities from localStorage:', error);
      return [];
    }
  },

  // Add a new activity
  addActivity: (type, propertyId, propertyTitle, propertyLocation, additionalData = {}) => {
    try {
      const activities = activityManager.getActivities();
      
      // Create new activity object
      const newActivity = {
        id: Date.now().toString(),
        type,
        propertyId,
        propertyTitle,
        propertyLocation,
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      // Add to beginning of array (most recent first)
      const updatedActivities = [newActivity, ...activities];
      
      // Keep only the latest MAX_ACTIVITIES
      const trimmedActivities = updatedActivities.slice(0, MAX_ACTIVITIES);
      
      // Save to localStorage
      localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(trimmedActivities));
      
      return true;
    } catch (error) {
      console.error('Error adding activity to localStorage:', error);
      return false;
    }
  },

  // Clear all activities
  clearActivities: () => {
    try {
      localStorage.removeItem(ACTIVITIES_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing activities from localStorage:', error);
      return false;
    }
  },

  // Get recent activities (limited number)
  getRecentActivities: (limit = 10) => {
    const activities = activityManager.getActivities();
    return activities.slice(0, limit);
  },

  // Get activity count
  getActivityCount: () => {
    const activities = activityManager.getActivities();
    return activities.length;
  },

  // Format activity for display
  formatActivity: (activity) => {
    const timeAgo = activityManager.getTimeAgo(activity.timestamp);
    
    switch (activity.type) {
      case activityTypes.VIEWED_CONTACT:
        return {
          ...activity,
          message: `Viewed owner contact for "${activity.propertyTitle}"`,
          icon: 'phone',
          color: 'blue',
          timeAgo
        };
      case activityTypes.SAVED_PROPERTY:
        return {
          ...activity,
          message: `Added "${activity.propertyTitle}" to favorites`,
          icon: 'heart',
          color: 'red',
          timeAgo
        };
      case activityTypes.REMOVED_FAVORITE:
        return {
          ...activity,
          message: `Removed "${activity.propertyTitle}" from favorites`,
          icon: 'heart-broken',
          color: 'gray',
          timeAgo
        };
      case activityTypes.VIEWED_PROPERTY:
        return {
          ...activity,
          message: `Viewed property "${activity.propertyTitle}"`,
          icon: 'eye',
          color: 'green',
          timeAgo
        };
      default:
        return {
          ...activity,
          message: `Activity on "${activity.propertyTitle}"`,
          icon: 'activity',
          color: 'gray',
          timeAgo
        };
    }
  },

  // Get time ago string
  getTimeAgo: (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }
};

export default activityManager;