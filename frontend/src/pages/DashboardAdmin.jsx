import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  UserCheck,
  Shield,
  BarChart3,
  Settings,
  Eye,
  Clock,
  X,
  MapPin,
  Home,
  Bed,
  Bath,
  Car,
  Phone,
  Mail,
  User,
  ExternalLink,
  Save,
  Zap
} from 'lucide-react';
import { adminApi, propertyApi } from '../utils/api';
import NotificationCenter from '../components/NotificationCenter';
import { getImageSrc } from '../utils/imageUtils';

const DashboardAdmin = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalProperties: 0,
    pendingVerifications: 0,
    approvedProperties: 0,
    rejectedProperties: 0
  });
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);
  
  // Verification settings state
  const [verificationSettings, setVerificationSettings] = useState({
    mode: 'manual',
    loading: false,
    saving: false
  });

  useEffect(() => {
    fetchDashboardData();
    fetchVerificationSettings();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin dashboard overview
      const overviewResponse = await adminApi.getStats();
      console.log('Admin overview response:', overviewResponse);
      
      if (overviewResponse.success) {
        const { overview } = overviewResponse.data;
        
        // Set statistics from overview data
        setStats({
          totalUsers: overview.users.regularUsers,
          totalAgents: overview.users.agents,
          totalProperties: overview.properties.total,
          pendingVerifications: overview.properties.pending,
          approvedProperties: overview.properties.verified || 0,
          rejectedProperties: overview.properties.rejected || 0
        });
      }

      // Fetch pending properties for verification section
      const pendingResponse = await adminApi.getPendingProperties();
      console.log('Pending properties response:', pendingResponse);
      
      if (pendingResponse.success) {
        const pendingProperties = pendingResponse.data.properties || [];
        setProperties(pendingProperties);
      }

      // Fetch all properties for activity feed
      const allPropertiesResponse = await propertyApi.getAllProperties();
      console.log('All properties response:', allPropertiesResponse);
      
      if (allPropertiesResponse.success) {
        const allPropsData = allPropertiesResponse.data.properties || allPropertiesResponse.data || [];
        setAllProperties(allPropsData);
      }

      // Fetch users
      const usersResponse = await adminApi.getUsers();
      console.log('Users response:', usersResponse);
      
      if (usersResponse.success) {
        const usersData = usersResponse.data.users || [];
        setUsers(usersData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty arrays to prevent filter errors
      setProperties([]);
      setAllProperties([]);
      setUsers([]);
      setStats({
        totalUsers: 0,
        totalAgents: 0,
        totalProperties: 0,
        pendingVerifications: 0,
        approvedProperties: 0,
        rejectedProperties: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationSettings = async () => {
    try {
      setVerificationSettings(prev => ({ ...prev, loading: true }));
      
      const response = await adminApi.getVerificationSettings();
      if (response.success) {
        setVerificationSettings(prev => ({
          ...prev,
          mode: response.data.verificationMode || 'manual',
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error fetching verification settings:', error);
      setVerificationSettings(prev => ({
        ...prev,
        mode: 'manual', // Default to manual on error
        loading: false
      }));
    }
  };

  const handleVerificationModeChange = async (newMode) => {
    try {
      setVerificationSettings(prev => ({ ...prev, saving: true }));
      
      const response = await adminApi.updateVerificationSettings({ verificationMode: newMode });
      if (response.success) {
        setVerificationSettings(prev => ({
          ...prev,
          mode: newMode,
          saving: false
        }));
        alert(`Verification mode changed to ${newMode} successfully!`);
      }
    } catch (error) {
      console.error('Error updating verification settings:', error);
      alert('Failed to update verification settings');
      setVerificationSettings(prev => ({ ...prev, saving: false }));
    }
  };

  const handleApproveProperty = async (propertyId) => {
    try {
      await adminApi.verifyProperty(propertyId, 'verified');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error approving property:', error);
      alert('Failed to approve property');
    }
  };

  const handleRejectProperty = async (propertyId) => {
    try {
      await adminApi.verifyProperty(propertyId, 'rejected');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting property:', error);
      alert('Failed to reject property');
    }
  };

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  const closePropertyModal = () => {
    setSelectedProperty(null);
    setShowPropertyModal(false);
  };

  // User Management Functions
  const handleManageUsers = () => {
    setShowUserManagementModal(true);
  };

  const closeUserManagementModal = () => {
    setShowUserManagementModal(false);
  };

  const handleBlockUser = async (userId) => {
    try {
      setUserActionLoading(true);
      await adminApi.updateUserStatus(userId, 'blocked');
      // Refresh users list
      const usersResponse = await adminApi.getUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.data.users || []);
      }
      alert('User blocked successfully');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      setUserActionLoading(true);
      await adminApi.updateUserStatus(userId, 'active');
      // Refresh users list
      const usersResponse = await adminApi.getUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.data.users || []);
      }
      alert('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      setUserActionLoading(true);
      await adminApi.updateUserRole(userId, newRole);
      // Refresh users list
      const usersResponse = await adminApi.getUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.data.users || []);
      }
      alert(`User role changed to ${newRole} successfully`);
    } catch (error) {
      console.error('Error changing user role:', error);
      alert('Failed to change user role');
    } finally {
      setUserActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'today';
    if (diffDays === 2) return 'yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatDetailedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getVerificationMethod = (property) => {
    // If property was verified immediately (auto verification)
    if (property.verificationStatus === 'verified' && property.autoVerified) {
      return 'Auto Verification';
    }
    // If property was manually approved
    if (property.verificationStatus === 'verified' && !property.autoVerified) {
      return 'Manual Verification';
    }
    // For pending properties, check current system mode
    if (property.verificationStatus === 'pending_verification') {
      return verificationSettings.mode === 'auto' ? 'Auto Verification (Pending)' : 'Manual Verification (Pending)';
    }
    return 'Manual Verification';
  };

  const pendingProperties = Array.isArray(properties) ? properties.slice(0, 10) : [];

  // Property Details Modal Component
  const PropertyDetailsModal = () => {
    if (!selectedProperty) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Property Details</h2>
            <button
              onClick={closePropertyModal}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {/* Basic Information */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg capitalize">{selectedProperty.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">₹{selectedProperty.price?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.squareFeet} sq ft</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Survey Number</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.surveyNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                  <p className={`inline-block px-3 py-1 rounded-full text-sm ${
                    selectedProperty.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                    selectedProperty.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedProperty.verificationStatus?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.description}</p>
              </div>
            </div>

            {/* Location Information */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.location?.district}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taluk</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.location?.taluk}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.location?.area}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.location?.pincode}</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.location?.address}</p>
              </div>
              {selectedProperty.location?.coordinates && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.location.coordinates.latitude}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.location.coordinates.longitude}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Features (for houses and rentals) */}
            {selectedProperty.features && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Property Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {selectedProperty.features.bedrooms && (
                    <div className="flex items-center">
                      <Bed className="h-5 w-5 text-gray-500 mr-2" />
                      <span>{selectedProperty.features.bedrooms} Bedrooms</span>
                    </div>
                  )}
                  {selectedProperty.features.bathrooms && (
                    <div className="flex items-center">
                      <Bath className="h-5 w-5 text-gray-500 mr-2" />
                      <span>{selectedProperty.features.bathrooms} Bathrooms</span>
                    </div>
                  )}
                  {selectedProperty.features.parking && (
                    <div className="flex items-center">
                      <Car className="h-5 w-5 text-gray-500 mr-2" />
                      <span>Parking Available</span>
                    </div>
                  )}
                </div>
                {selectedProperty.features.furnished && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Furnished Status</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg capitalize">{selectedProperty.features.furnished.replace('-', ' ')}</p>
                  </div>
                )}
                {selectedProperty.features.amenities && selectedProperty.features.amenities.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProperty.features.amenities.map((amenity, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm capitalize">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Owner Details */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Owner Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProperty.ownerDetails?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {selectedProperty.ownerDetails?.phone}
                  </p>
                </div>
                {selectedProperty.ownerDetails?.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedProperty.ownerDetails.email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            {selectedProperty.images && selectedProperty.images.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Property Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedProperty.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={image.caption || `Property image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
                        }}
                      />
                      {image.isPrimary && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs rounded">
                          Primary
                        </span>
                      )}
                      {image.caption && (
                        <p className="mt-2 text-sm text-gray-600">{image.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Information */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Listed by Agent</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-primary-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">{selectedProperty.uploadedBy?.name || 'Unknown Agent'}</h4>
                    <p className="text-gray-600">{selectedProperty.uploadedBy?.email}</p>
                    <p className="text-gray-600">{selectedProperty.uploadedBy?.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4 pt-6 border-t">
              <button
                onClick={() => {
                  handleApproveProperty(selectedProperty._id);
                  closePropertyModal();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Property
              </button>
              <button
                onClick={() => {
                  handleRejectProperty(selectedProperty._id);
                  closePropertyModal();
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject Property
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-professional-split pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">System overview and management tools</p>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationCenter isAdmin={true} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-gray-600">Total Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
                <p className="text-gray-600">Verified Agents</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
                <p className="text-gray-600">Total Properties</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.pendingVerifications}</p>
                <p className="text-gray-600">Pending Verifications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Settings */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Property Verification Settings
                </h3>
                <p className="text-gray-600">Configure how new properties are verified in the system</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${verificationSettings.mode === 'auto' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {verificationSettings.mode === 'auto' ? 'Auto Mode Active' : 'Manual Mode Active'}
                </span>
              </div>
            </div>

            {verificationSettings.loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Loading settings...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manual Verification Option */}
                <div className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  verificationSettings.mode === 'manual' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="verificationMode"
                      value="manual"
                      checked={verificationSettings.mode === 'manual'}
                      onChange={(e) => handleVerificationModeChange(e.target.value)}
                      disabled={verificationSettings.saving}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <Shield className="h-6 w-6 text-blue-600 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">Manual Verification</h4>
                      </div>
                      <p className="text-gray-600 mb-4">
                        All property submissions require admin approval. Properties are reviewed manually and verified through external land records.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Admin review required
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Manual land record verification
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          High accuracy assurance
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Auto Verification Option */}
                <div className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  verificationSettings.mode === 'auto' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="verificationMode"
                      value="auto"
                      checked={verificationSettings.mode === 'auto'}
                      onChange={(e) => handleVerificationModeChange(e.target.value)}
                      disabled={verificationSettings.saving}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <Zap className="h-6 w-6 text-green-600 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">Auto Verification</h4>
                        <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          NEW
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Properties are automatically verified using survey number API. Valid survey numbers are instantly approved and go live.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Instant verification
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          API-based survey validation
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Faster property listing
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {verificationSettings.saving && (
              <div className="mt-6 flex items-center justify-center py-4 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Updating verification settings...</span>
              </div>
            )}

           
          </div>      </div>

        {/* Manual Verification Button */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tamil Nadu Land Records Verification</h3>
                <p className="text-gray-600">Access official Tamil Nadu land records for manual property verification</p>
              </div>
              <a
                href="https://eservices.tn.gov.in/eservicesnew/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Manual Verification
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Pending Property Verifications</h2>
              {pendingProperties.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No pending verifications!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProperties.map((property) => (
                    <div key={property._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <img
                          src={getImageSrc(property.images?.[0])}
                          alt="Property"
                          className="w-15 h-15 rounded-lg mr-4 object-cover"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{property.title}</h3>
                          <p className="text-sm text-gray-600">
                            Submitted by: {property.uploadedBy?.name || 'Unknown'} • {formatDate(property.createdAt)}
                          </p>
                          <p className="text-sm text-primary-600">₹{property.price?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewDetails(property)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </button>
                        <button 
                          onClick={() => handleApproveProperty(property._id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                           Approve
                        </button>
                        <button 
                          onClick={() => handleRejectProperty(property._id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Agent Activities</h2>
              <div className="space-y-4">
                {Array.isArray(allProperties) && allProperties
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 8)
                  .map((property) => (
                  <div key={property._id} className={`flex items-start p-4 rounded-lg border-l-4 ${
                    property.verificationStatus === 'verified' 
                      ? 'bg-green-50 border-l-green-500' :
                    property.verificationStatus === 'rejected' 
                      ? 'bg-red-50 border-l-red-500' :
                    'bg-yellow-50 border-l-yellow-500'
                  }`}>
                    <div className="flex-shrink-0">
                      {property.verificationStatus === 'verified' ? 
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /> :
                        property.verificationStatus === 'rejected' ?
                        <Shield className="h-5 w-5 text-red-500 mt-0.5" /> :
                        <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                      }
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="text-blue-600">{property.uploadedBy?.name || 'Unknown Agent'}</span> uploaded 
                        <span className="text-gray-800"> '{property.title}'</span>
                      </p>
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-gray-600">
                          📅 {formatDetailedDate(property.createdAt)} • 
                          🔧 {getVerificationMethod(property)} • 
                          💰 ₹{property.price?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          📍 {property.location?.area}, {property.location?.district}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            property.verificationStatus === 'verified' 
                              ? 'bg-green-100 text-green-800' :
                            property.verificationStatus === 'rejected' 
                              ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {property.verificationStatus === 'verified' ? '✅ Approved' :
                             property.verificationStatus === 'rejected' ? '❌ Rejected' :
                             '⏳ Pending Review'}
                          </span>
                          {property.autoVerified && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              🤖 Auto-Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Show message if no properties */}
                {(!Array.isArray(allProperties) || allProperties.length === 0) && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No recent agent activities</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/properties"
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Browse Properties
                </Link>
                <button 
                  onClick={handleManageUsers}
                  className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Approved Properties</span>
                  <span className="font-semibold text-green-600">
                    {stats.approvedProperties}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending Reviews</span>
                  <span className="font-semibold text-yellow-600">
                    {stats.pendingVerifications}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rejected Properties</span>
                  <span className="font-semibold text-red-600">
                    {stats.rejectedProperties}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Details Modal */}
      {showPropertyModal && <PropertyDetailsModal />}

      {/* User Management Modal */}
      {showUserManagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <button
                onClick={closeUserManagementModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Total Users: {users.length}
                </h4>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">{user.name}</h5>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === 'agent'
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {user.role !== 'admin' && (
                            <>
                              {user.status === 'active' ? (
                                <button
                                  onClick={() => handleBlockUser(user._id)}
                                  disabled={userActionLoading}
                                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Block
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnblockUser(user._id)}
                                  disabled={userActionLoading}
                                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Unblock
                                </button>
                              )}
                              
                              <select
                                value={user.role}
                                onChange={(e) => handleChangeUserRole(user._id, e.target.value)}
                                disabled={userActionLoading}
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="user">User</option>
                                <option value="agent">Agent</option>
                              </select>
                            </>
                          )}
                          
                          {user.role === 'admin' && (
                            <span className="px-3 py-1 text-sm text-gray-500 italic">Admin User</span>
                          )}
                        </div>
                      </div>
                      
                      {user.phone && (
                        <div className="mt-3 flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={closeUserManagementModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;