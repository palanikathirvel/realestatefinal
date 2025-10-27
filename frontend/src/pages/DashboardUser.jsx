import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Heart,
  MessageCircle,
  Bell,
  Settings,
  Calendar,
  TrendingUp,
  Search,
  Eye,
  MapPin,
  IndianRupee,
  Phone,
  Activity,
  Clock
} from 'lucide-react';
import { propertyApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import PropertyCard from '../components/PropertyCard';
import { getImageSrc } from '../utils/imageUtils';
import { localFavoritesManager } from '../utils/localFavorites';
import { activityManager, activityTypes } from '../utils/recentActivities';

const DashboardUser = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    favorites: 0,
    inquiries: 0,
    visits: 0,
    viewed: 0
  });

  useEffect(() => {
    if (!isAuthenticated() || user.role !== 'user') {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [user, isAuthenticated, navigate]);

  // Refresh activities when component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated()) {
        const activities = activityManager.getRecentActivities(5);
        setRecentActivities(activities);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch favorite properties (with fallback to local storage)
      try {
        const favResponse = await propertyApi.getFavorites();
        if (favResponse.success) {
          setFavorites(favResponse.data.favorites || []);
          setStats(prev => ({ ...prev, favorites: favResponse.data.favorites?.length || 0 }));
        }
      } catch (error) {
        console.log('Favorites API not available, using local storage fallback');
        
        // Fallback to local storage using utility
        const localFavoriteIds = localFavoritesManager.getFavoriteIds();
        setStats(prev => ({ ...prev, favorites: localFavoriteIds.length }));
        
        // Try to fetch property details for local favorites
        if (localFavoriteIds.length > 0) {
          try {
            const favoriteProperties = [];
            for (const propertyId of localFavoriteIds) {
              try {
                const propResponse = await propertyApi.getPropertyById(propertyId);
                if (propResponse.success) {
                  favoriteProperties.push(propResponse.data.property);
                }
              } catch (propError) {
                console.log(`Could not fetch property ${propertyId}:`, propError.message);
              }
            }
            setFavorites(favoriteProperties);
          } catch (fetchError) {
            console.log('Error fetching favorite property details:', fetchError);
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }
      }

      // Fetch recently viewed properties
      try {
        const response = await propertyApi.searchProperties({ limit: 4 });
        if (response.success) {
          setRecentlyViewed(response.data.properties || []);
          setStats(prev => ({ 
            ...prev, 
            viewed: response.data.properties?.length || 0 
          }));
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setRecentlyViewed([]);
      }

      // Load recent activities from localStorage
      const activities = activityManager.getRecentActivities(5);
      setRecentActivities(activities);

      // Mock stats for now
      setStats(prev => ({
        ...prev,
        inquiries: 0,
        visits: 0
      }));

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
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

  const getActivityIcon = (iconType, color) => {
    const iconClass = `h-5 w-5`;
    const colorClasses = {
      blue: 'text-blue-500',
      red: 'text-red-500',
      green: 'text-green-500',
      gray: 'text-gray-500',
      yellow: 'text-yellow-500'
    };

    switch (iconType) {
      case 'phone':
        return <Phone className={`${iconClass} ${colorClasses[color] || colorClasses.gray}`} />;
      case 'heart':
        return <Heart className={`${iconClass} ${colorClasses[color] || colorClasses.red}`} />;
      case 'heart-broken':
        return <Heart className={`${iconClass} ${colorClasses[color] || colorClasses.gray}`} />;
      case 'eye':
        return <Eye className={`${iconClass} ${colorClasses[color] || colorClasses.green}`} />;
      case 'activity':
      default:
        return <Activity className={`${iconClass} ${colorClasses[color] || colorClasses.gray}`} />;
    }
  };

  const addSampleActivity = () => {
    // Add a sample activity for demonstration
    activityManager.addActivity(
      activityTypes.SAVED_PROPERTY,
      'demo123',
      'Beautiful 3BHK Apartment in Chennai',
      'T. Nagar, Chennai',
      { price: '₹85 Lakhs' }
    );
    
    // Refresh activities list
    const activities = activityManager.getRecentActivities(5);
    setRecentActivities(activities);
  };

  if (!isAuthenticated() || user.role !== 'user') {
    return null;
  }
  return (
    <div className="min-h-screen bg-subtle-gradient pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600">Discover your dream property in Tamil Nadu</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.favorites}</p>
                <p className="text-gray-600">Favorite Properties</p>
              </div>
            </div>
          </div>

          

         

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.viewed}</p>
                <p className="text-gray-600">Properties Viewed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Recently Viewed Properties */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recently Viewed Properties</h2>
                <Link 
                  to="/properties" 
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg h-32"></div>
                      <div className="mt-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentlyViewed.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentlyViewed.map((property) => (
                    <div key={property._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <Link to={`/property/${property._id}`}>
                        <img
                          src={getImageSrc(property.images?.[0])}
                          alt={property.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                            {property.title}
                          </h3>
                          <div className="flex items-center text-gray-600 text-xs mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">
                              {property.location?.area}, {property.location?.district}
                            </span>
                          </div>
                          <div className="flex items-center text-primary-600 font-semibold">
                            <IndianRupee className="h-4 w-4" />
                            <span>{formatPrice(property.price)}</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recently viewed properties</h3>
                  <p className="text-gray-600 mb-4">Start exploring properties to see them here.</p>
                  <Link
                    to="/properties"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Browse Properties
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
                {recentActivities.length > 0 && (
                  <button
                    onClick={() => {
                      activityManager.clearActivities();
                      setRecentActivities([]);
                    }}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                {recentActivities.length === 0 && (
                  <button
                    onClick={addSampleActivity}
                    className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Add Demo Activity
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const formattedActivity = activityManager.formatActivity(activity);
                    return (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(formattedActivity.icon, formattedActivity.color)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium">
                            {formattedActivity.message}
                          </p>
                          {activity.propertyLocation && (
                            <p className="text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {activity.propertyLocation}
                            </p>
                          )}
                          <div className="flex items-center mt-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {formattedActivity.timeAgo}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Link
                            to={`/property/${activity.propertyId}`}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View Property
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activities</h3>
                    <p className="text-gray-600 mb-4">Your activities will appear here as you interact with properties.</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>• View owner contact details</p>
                      <p>• Save properties to favorites</p>
                      <p>• Browse property listings</p>
                    </div>
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
                  className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Properties
                </Link>
                <Link
                  to="/profile"
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              
                
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Search Tips</h2>
              <div className="space-y-4 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 font-medium mb-1">Use Filters</p>
                  <p className="text-blue-700">Narrow down properties by location</p>
                </div>
                
               
                
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800 font-medium mb-1">Contact Agents</p>
                  <p className="text-yellow-700">Directly message agents for property inquiries.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardUser;