// Format currency in Indian Rupees
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format currency in lakhs/crores for better readability
export const formatCurrencyCompact = (amount) => {
  if (typeof amount !== 'number') return '₹0';
  
  if (amount >= 10000000) { // 1 crore
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  } else if (amount >= 100000) { // 1 lakh
    return `₹${(amount / 100000).toFixed(1)} L`;
  } else {
    return formatCurrency(amount);
  }
};

// Format square feet
export const formatSquareFeet = (sqft) => {
  if (typeof sqft !== 'number') return '0 sq ft';
  
  return `${sqft.toLocaleString('en-IN')} sq ft`;
};

// Format date
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format date and time
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return formatDate(date);
  }
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Capitalize each word
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

// Generate property type display name
export const getPropertyTypeDisplay = (type) => {
  const typeMap = {
    land: 'Land',
    house: 'House',
    rental: 'Rental'
  };
  return typeMap[type] || capitalize(type);
};

// Generate verification status display
export const getVerificationStatusDisplay = (status) => {
  const statusMap = {
    pending_verification: 'Pending Verification',
    verified: 'Verified',
    rejected: 'Rejected'
  };
  return statusMap[status] || capitalize(status.replace('_', ' '));
};

// Get verification status color
export const getVerificationStatusColor = (status) => {
  const colorMap = {
    pending_verification: 'text-yellow-600 bg-yellow-100',
    verified: 'text-green-600 bg-green-100',
    rejected: 'text-red-600 bg-red-100'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-100';
};

// Get user role display name
export const getUserRoleDisplay = (role) => {
  const roleMap = {
    user: 'User',
    agent: 'Agent',
    admin: 'Admin'
  };
  return roleMap[role] || capitalize(role);
};

// Get user role color
export const getUserRoleColor = (role) => {
  const colorMap = {
    user: 'text-blue-600 bg-blue-100',
    agent: 'text-purple-600 bg-purple-100',
    admin: 'text-red-600 bg-red-100'
  };
  return colorMap[role] || 'text-gray-600 bg-gray-100';
};

// Validate Indian phone number
export const validateIndianPhone = (phone) => {
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Format Indian phone number
export const formatIndianPhone = (phone) => {
  if (!phone) return '';
  
  // Remove +91 prefix if present
  const cleanPhone = phone.replace('+91', '');
  
  // Add +91 prefix
  return `+91${cleanPhone}`;
};

// Validate email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate initials from name
export const getInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

// Generate random color for avatars
export const getRandomColor = () => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Local storage helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error parsing localStorage item:', error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting localStorage item:', error);
    }
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  },
  
  clear: () => {
    localStorage.clear();
  }
};

// Generate property URL slug
export const generateSlug = (title, id) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `${slug}-${id}`;
};

// Parse property slug to get ID
export const parseSlug = (slug) => {
  const parts = slug.split('-');
  return parts[parts.length - 1];
};

// Check if user is on mobile device
export const isMobile = () => {
  return window.innerWidth < 768;
};

// Scroll to top
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};