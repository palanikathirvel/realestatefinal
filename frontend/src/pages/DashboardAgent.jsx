import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building, 
  Plus, 
  Eye, 
  MessageCircle, 
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { propertyApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import PropertyCard from '../components/PropertyCard';
import NotificationCenter from '../components/NotificationCenter';
import { getImageSrc } from '../utils/imageUtils';
import Modal from '../components/Modal';
import PropertyForm from './PropertyForm';

const DashboardAgent = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending_verification: 0,
    verified: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || user.role !== 'agent') {
      navigate('/login');
      return;
    }
    fetchAgentProperties();
  }, [user, isAuthenticated, navigate]);

  const fetchAgentProperties = async (status = '') => {
    try {
      setLoading(true);
      const response = await propertyApi.getAgentProperties();
      
      if (response.success) {
        setProperties(response.data.properties || []);
        setStats(response.data.statusCounts || stats);
      }
    } catch (error) {
      console.error('Error fetching agent properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      const response = await propertyApi.deleteProperty(propertyId);
      if (response.success) {
        fetchAgentProperties(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property. Please try again.');
    }
  };

  const filterProperties = () => {
    if (selectedStatus === 'all') return properties;
    return properties.filter(property => property.verificationStatus === selectedStatus);
  };

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const getPriceDisplay = (property) => {
    if (property.type === 'rental' && property.monthlyPayment?.amount) {
      return `${formatPrice(property.monthlyPayment.amount)}/month`;
    }
    if (property.type === 'land' && property.pricePerAcre) {
      return `${formatPrice(property.price)} (${formatPrice(property.pricePerAcre)}/acre)`;
    }
    return formatPrice(property.price);
  };

  if (!isAuthenticated() || user.role !== 'agent') {
    return null;
  }
  return (
    <div className="min-h-screen bg-modern-fade pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
            <p className="text-gray-600">Manage your property listings and client inquiries</p>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationCenter />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-gray-600">Total Listings</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
                <p className="text-gray-600">Verified</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.pending_verification}</p>
                <p className="text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                <p className="text-gray-600">Need Attention</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Properties</h2>
                <div className="flex items-center space-x-4">
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending_verification">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="w-16 h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filterProperties().length > 0 ? (
                <div className="space-y-4">
                  {filterProperties().map((property) => (
                    <div key={property._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <img
                          src={getImageSrc(property.images?.[0])}
                          alt={property.title}
                          className="w-16 h-16 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{property.title}</h3>
                          <p className="text-sm text-gray-600">
                            {getPriceDisplay(property)} • {property.squareFeet || property.area} sq ft
                          </p>
                          <p className="text-xs text-gray-500">
                            {property.location?.area}, {property.location?.district}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`flex items-center px-2 py-1 text-xs rounded ${
                          property.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                          property.verificationStatus === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {property.verificationStatus === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {property.verificationStatus === 'pending_verification' && <Clock className="h-3 w-3 mr-1" />}
                          {property.verificationStatus === 'rejected' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {property.verificationStatus === 'verified' ? 'Verified' : 
                           property.verificationStatus === 'pending_verification' ? 'Pending' : 'Rejected'}
                        </span>
                        <span className="text-sm text-gray-600">{property.views || 0} views</span>
                        
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/property/${property._id}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/properties/edit/${property._id}`}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProperty(property._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                  <p className="text-gray-600 mb-4">
                    {selectedStatus === 'all' 
                      ? "You haven't added any properties yet."
                      : `No properties with status "${selectedStatus}"`
                    }
                  </p>
                  <Link
                    to="#"
                    onClick={(e) => { e.preventDefault(); setShowAddModal(true); }}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Property
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="#"
                  onClick={(e) => { e.preventDefault(); setShowAddModal(true); }}
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5 mr-3 text-primary-600" />
                  Add New Property
                </Link>
                <Link
                  to="/properties"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Building className="h-5 w-5 mr-3 text-primary-600" />
                  Browse Properties
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Users className="h-5 w-5 mr-3 text-primary-600" />
                  Update Profile
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
        {showAddModal && (
          <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Property">
            <PropertyForm onSuccess={async () => { setShowAddModal(false); await fetchAgentProperties(); }} />
          </Modal>
        )}
      </div>
  );
};
  export default DashboardAgent;