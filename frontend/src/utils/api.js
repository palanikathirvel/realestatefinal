// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios-like API client
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        // Create more detailed error message for validation failures
        let errorMessage = data.message || 'API request failed';
        
        if (data.errors && Array.isArray(data.errors)) {
          const validationErrors = data.errors.map(err => `${err.path || err.param}: ${err.msg}`).join(', ');
          errorMessage = `Validation failed: ${validationErrors}`;
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.errors = data.errors;
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// Authentication API
export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  verifyOTP: (otpData) => apiClient.post('/auth/verify-otp', otpData),
  resendOTP: (phone) => apiClient.post('/auth/resend-otp', { phone }),
  changePassword: (passwordData) => apiClient.put('/auth/change-password', passwordData),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (profileData) => apiClient.put('/auth/profile', profileData),
};

// Property API
export const propertyApi = {
  // Get all properties with filters
  searchProperties: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/properties${queryString ? `?${queryString}` : ''}`);
  },

  // Get all properties (for admin)
  getAllProperties: () => apiClient.get('/properties/all'),

  // Get property by ID
  getPropertyById: (id) => apiClient.get(`/properties/${id}`),

  // Create new property (agent/admin only)
  createProperty: (propertyData) => apiClient.post('/properties', propertyData),

  // Update property (agent/admin only)
  updateProperty: (id, propertyData) => apiClient.put(`/properties/${id}`, propertyData),

  // Delete property (agent/admin only)
  deleteProperty: (id) => apiClient.delete(`/properties/${id}`),

  // Get agent's properties
  getAgentProperties: () => apiClient.get('/properties/agent/my-properties'),

  // Request verification
  requestVerification: (id) => apiClient.post(`/properties/${id}/verify`),

  // Add to favorites
  addToFavorites: (id) => apiClient.post(`/properties/favorites/${id}`),

  // Remove from favorites
  removeFromFavorites: (id) => apiClient.delete(`/properties/favorites/${id}`),

  // Get user's favorites
  getFavorites: () => apiClient.get('/properties/user/favorites'),

  // Send contact message to property agent
  sendContactMessage: (propertyId, messageData) => apiClient.post(`/properties/${propertyId}/contact-message`, messageData),
};

// User API
export const userApi = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (profileData) => apiClient.put('/users/profile', profileData),
  getInquiries: () => apiClient.get('/users/inquiries'),
  createInquiry: (inquiryData) => apiClient.post('/users/inquiries', inquiryData),
  getAllUsers: () => apiClient.get('/users/all'), // For admin
};

// Admin API
export const adminApi = {
  // User management
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },
  updateUser: (id, userData) => apiClient.put(`/admin/users/${id}`, userData),
  updateUserStatus: (id, status) => apiClient.put(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id, role) => apiClient.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),

  // Property verification
  getPendingProperties: () => apiClient.get('/admin/properties/pending'),
  verifyProperty: (id, status) => apiClient.put(`/admin/properties/${id}/verify`, { status }),

  // Statistics
  getStats: () => apiClient.get('/admin/dashboard'),
  getActivities: () => apiClient.get('/admin/activities'),

  // Verification settings
  getVerificationSettings: () => apiClient.get('/admin/settings/verification'),
  updateVerificationSettings: (settings) => apiClient.put('/admin/settings/verification', settings),
};

// OTP API for WhatsApp verification (no authentication required)
export const otpApi = {
  sendWhatsAppOTP: (whatsappNumber, propertyId) => 
    apiClient.post('/otp/send-whatsapp', { whatsappNumber, propertyId }),
  
  verifyWhatsAppOTP: (whatsappNumber, otp, propertyId) =>
    apiClient.post('/otp/verify-whatsapp', { whatsappNumber, otp, propertyId }),

  // Email OTP for Contact Owner (new functionality)
  sendEmailOTPContact: (email, propertyId) => 
    apiClient.post('/otp/send-email-contact', { email, propertyId }),
  
  verifyEmailOTPContact: (email, otp, propertyId, userId = null) =>
    apiClient.post('/otp/verify-email-contact', { email, otp, propertyId, userId }),
};

// Notification API
export const notificationApi = {
  // Get user's notifications
  getMyNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/notifications/my-notifications${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get all notifications (admin only)
  getAllNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/notifications/all${queryString ? `?${queryString}` : ''}`);
  },
  
  // Mark notification as read
  markAsRead: (id) =>
    apiClient.put(`/notifications/${id}/read`),
  
  // Mark all notifications as read
  markAllAsRead: () =>
    apiClient.put('/notifications/mark-all-read'),
  
  // Archive notification
  archiveNotification: (id) =>
    apiClient.put(`/notifications/${id}/archive`),
  
  // Delete notification
  deleteNotification: (id) =>
    apiClient.delete(`/notifications/${id}`),
  
  // Get unread count
  getUnreadCount: () =>
    apiClient.get('/notifications/unread-count'),
};

// Export the API client for custom requests
export default apiClient;