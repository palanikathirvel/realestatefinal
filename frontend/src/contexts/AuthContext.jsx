import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
};

// Actions
const authActions = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case authActions.LOGIN_START:
    case authActions.REGISTER_START:
      return { ...state, loading: true, error: null };

    case authActions.LOGIN_SUCCESS:
    case authActions.REGISTER_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };

    case authActions.LOGIN_FAILURE:
    case authActions.REGISTER_FAILURE:
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        error: action.payload
      };

    case authActions.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };

    case authActions.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false
      };

    case authActions.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case authActions.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Set axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/profile`);
          dispatch({
            type: authActions.SET_USER,
            payload: response.data.data.user
          });
        } catch (error) {
          console.error('Failed to load user:', error);
          dispatch({ type: authActions.LOGOUT });
        }
      } else {
        dispatch({ type: authActions.SET_LOADING, payload: false });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: authActions.LOGIN_START });
    // Ensure both email and username are sent if available, and trim values
    const loginPayload = {
      email: credentials.email?.trim() || '',
      password: credentials.password,
      username: credentials.username?.trim() || credentials.name?.trim() || ''
    };
    console.log('Login payload:', loginPayload); // Debug log
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginPayload);
      console.log('Login response:', response.data); // Debug log
      const { user, token } = response.data.data;
      dispatch({
        type: authActions.LOGIN_SUCCESS,
        payload: { user, token }
      });
      return { success: true, data: { user, token } };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message); // Debug log
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: authActions.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: authActions.REGISTER_START });

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      const { user, token } = response.data.data;

      dispatch({
        type: authActions.REGISTER_SUCCESS,
        payload: { user, token }
      });

      return { success: true, data: { user, token } };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: authActions.REGISTER_FAILURE,
        payload: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: authActions.LOGOUT });
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, profileData);
      const updatedUser = response.data.data.user;

      dispatch({
        type: authActions.SET_USER,
        payload: updatedUser
      });

      return { success: true, data: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/change-password`, passwordData);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: authActions.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!state.token && !!state.user;
  };

  // Get user role
  const getUserRole = () => {
    return state.user?.role || null;
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    hasRole,
    isAuthenticated,
    getUserRole,
    API_BASE_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};