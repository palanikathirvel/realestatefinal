import axios from 'axios';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 429) {
      // Handle rate limiting
      const message = 'Too many requests. Please wait 15 minutes before trying again.';
      alert(message);
      throw new Error(message);
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  // Send Email OTP
  sendEmailOTP: (data) => {
    return api.post('/auth/send-email-otp', data);
  },

  // Verify Email OTP and Complete Registration
  verifyEmailAndRegister: (data) => {
    return api.post('/auth/verify-email-otp', data);
  },

  // Resend Email OTP
  resendEmailOTP: (data) => {
    return api.post('/auth/resend-email-otp', data);
  },

  // Traditional registration (legacy)
  register: (data) => {
    return api.post('/auth/register', data);
  },

  // Login
  login: (data) => {
    return api.post('/auth/login', data);
  },

  // Logout
  logout: () => {
    return api.post('/auth/logout');
  },

  // Get user profile
  getProfile: () => {
    return api.get('/auth/profile');
  },

  // Update profile
  updateProfile: (data) => {
    return api.put('/auth/profile', data);
  },

  // Change password
  changePassword: (data) => {
    return api.put('/auth/change-password', data);
  }
};

// Property API functions
export const propertyAPI = {
  // Get all properties with filters
  getAllProperties: (params = {}) => {
    return api.get('/properties', { params });
  },

  // Get properties by type
  getPropertiesByType: (type, params = {}) => {
    return api.get(`/properties/type/${type}`, { params });
  },

  // Get property by ID
  getPropertyById: (id) => {
    return api.get(`/properties/${id}`);
  },

  // Create new property (Agent only)
  createProperty: (propertyData) => {
    return api.post('/properties', propertyData);
  },

  // Update property
  updateProperty: (id, propertyData) => {
    return api.put(`/properties/${id}`, propertyData);
  },

  // Delete property
  deleteProperty: (id) => {
    return api.delete(`/properties/${id}`);
  },

  // Get agent's properties
  getAgentProperties: (params = {}) => {
    return api.get('/properties/agent/my-properties', { params });
  }
};

// OTP API functions
export const otpAPI = {
  // Send OTP
  sendOTP: (data) => {
    return api.post('/otp/send', data);
  },

  // Verify OTP
  verifyOTP: (data) => {
    return api.post('/otp/verify', data);
  },

  // Get OTP status
  getOTPStatus: (otpId) => {
    return api.get(`/otp/status/${otpId}`);
  },

  // Resend OTP
  resendOTP: (data) => {
    return api.post('/otp/resend', data);
  }
};

// Admin API functions
export const adminAPI = {
  // Get dashboard overview
  getDashboard: () => {
    return api.get('/admin/dashboard');
  },

  // Get pending properties
  getPendingProperties: (params = {}) => {
    return api.get('/admin/properties/pending', { params });
  },

  // Verify property
  verifyProperty: (id, data) => {
    return api.put(`/admin/properties/${id}/verify`, data);
  },

  // Get all users
  getAllUsers: (params = {}) => {
    return api.get('/admin/users', { params });
  },

  // Update user status
  updateUserStatus: (id, data) => {
    return api.put(`/admin/users/${id}/status`, data);
  },

  // Get activities
  getActivities: (params = {}) => {
    return api.get('/admin/activities', { params });
  },

  // Get security alerts
  getSecurityAlerts: (params = {}) => {
    return api.get('/admin/security-alerts', { params });
  },

  // Get analytics
  getAnalytics: (params = {}) => {
    return api.get('/admin/analytics', { params });
  }
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

// File upload function (if needed for images)
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export default api;