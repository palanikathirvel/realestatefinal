import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Import pages
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import PropertyForm from './pages/PropertyForm';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import DashboardUser from './pages/DashboardUser';
import DashboardAgent from './pages/DashboardAgent';
import DashboardAdmin from './pages/DashboardAdmin';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated()) {
    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/dashboard/admin" replace />;
      case 'agent':
        return <Navigate to="/dashboard/agent" replace />;
      default:
        return <Navigate to="/dashboard/user" replace />;
    }
  }

  return children;
};

// Main App Content
const AppContent = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/properties" element={<Layout><Properties /></Layout>} />
        <Route path="/property/:id" element={<Layout><PropertyDetails /></Layout>} />
        <Route path="/admindashboard" element={<Layout><DashboardAdmin /></Layout>} />
        
        {/* Auth routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } 
        />

        {/* Protected routes */}
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute requiredRole="user">
              <Layout><DashboardUser /></Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard/agent"
          element={
            <ProtectedRoute requiredRole="agent">
              <Layout><DashboardAgent /></Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout><DashboardAdmin /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Property management routes for agents */}
        <Route
          path="/properties/add"
          element={
            <ProtectedRoute requiredRole="agent">
              <Layout><PropertyForm /></Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/properties/edit/:id"
          element={
            <ProtectedRoute requiredRole="agent">
              <Layout><PropertyForm /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all routes */}
        <Route path="/unauthorized" element={<Layout><div className="text-center py-12"><h1 className="text-2xl font-bold text-gray-900">Unauthorized Access</h1><p className="text-gray-600 mt-2">You don't have permission to access this page.</p></div></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </Router>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
