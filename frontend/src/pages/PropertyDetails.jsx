import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  IndianRupee,
  Heart,
  Share2,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Map,
  Hospital,
  GraduationCap,
  ShoppingBag,
  Fuel,
  Coffee,
  Train,
  PlayCircle
} from 'lucide-react';
import { propertyApi, otpApi } from '../utils/api';
import { getImageSrc, getVideoSrc } from '../utils/imageUtils';
import { useAuth } from '../contexts/AuthContext';
import localFavoritesManager from '../utils/localFavorites';
import { activityManager, activityTypes } from '../utils/recentActivities';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showOwnerContactModal, setShowOwnerContactModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showOwnerDetailsModal, setShowOwnerDetailsModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  
  // OTP Flow State
  const [ownerContactForm, setOwnerContactForm] = useState({
    email: ''
  });
  const [otpForm, setOtpForm] = useState({
    otp: ''
  });
  const [ownerDetails, setOwnerDetails] = useState(null);
  
  // Amenities Map State
  const [showAmenitiesMap, setShowAmenitiesMap] = useState(false);
  const [nearbyAmenities, setNearbyAmenities] = useState([]);
  const [amenitiesLoading, setAmenitiesLoading] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: ''
  });

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
      checkIfFavorited();
    }
  }, [id]);

  const checkIfFavorited = async () => {
    if (!isAuthenticated()) {
      return;
    }
    
    try {
      // First try to get from backend API
      const response = await propertyApi.getFavorites();
      if (response.success && response.data) {
        const favoriteProperties = response.data;
        const isPropertyFavorited = favoriteProperties.some(favProp => 
          (favProp._id || favProp.id) === id
        );
        setIsFavorited(isPropertyFavorited);
      }
    } catch (error) {
      console.log('Favorites API not available, using local storage fallback');
      // Fallback to local storage using utility
      const isPropertyFavorited = localFavoritesManager.isFavorite(id);
      setIsFavorited(isPropertyFavorited);
    }
  };

  // Create mediaItems array combining images and video
  useEffect(() => {
    if (property) {
      const items = [];

      // Add images safely
      const images = property.images || [];
      images.forEach((image, index) => {
        items.push({
          type: 'image',
          data: image,
          index: index
        });
      });

      // Add video if exists
      if (property.video) {
        items.push({
          type: 'video',
          data: property.video,
          index: items.length
        });
      }

      setMediaItems(items);
      // Reset index if needed
      if (currentMediaIndex >= items.length) {
        setCurrentMediaIndex(0);
      }
    }
  }, [property, currentMediaIndex]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await propertyApi.getPropertyById(id);
      
      if (response.success) {
        setProperty(response.data.property);
        
        // Record activity for viewing property (only if user is authenticated)
        if (isAuthenticated()) {
          const propertyData = response.data.property;
          activityManager.addActivity(
            activityTypes.VIEWED_PROPERTY,
            id,
            propertyData.title,
            `${propertyData.location?.area}, ${propertyData.location?.district}`
          );
        }
        
      } else {
        setError('Property not found');
      }
    } catch (err) {
      setError('Failed to load property details');
      console.error('Error fetching property:', err);
    } finally {
      setLoading(false);
    }
  };

  // Google Maps Script Loader
  const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined') {
        resolve(google);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        reject(new Error('Google Maps API key not configured'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        resolve(google);
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'));
      };
      document.head.appendChild(script);
    });
  };

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(1)} Crore`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(1)} Lakh`;
    } else {
      return price.toLocaleString();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const response = await propertyApi.sendContactMessage(id, contactForm);

      if (response.success) {
        setShowContactForm(false);
        setContactForm({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          message: ''
        });
        alert('Message sent successfully! The agent will get back to you soon.');
      } else {
        alert(response.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please check your connection and try again.');
    }
  };

  // Contact Owner OTP Flow Functions
  const handleOwnerContactRequest = () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    setShowOwnerContactModal(true);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!ownerContactForm.email || !emailRegex.test(ownerContactForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setOtpLoading(true);
      // Use route id (guaranteed) instead of property._id to avoid undefined/stale values
      const propertyId = id || property?._id;
      console.log('Sending contact OTP for propertyId:', propertyId);

      // Pre-check: ensure property exists on backend before sending OTP
      try {
        const propResp = await propertyApi.getPropertyById(propertyId);
        if (!propResp || !propResp.success) {
          console.error('Property pre-check failed:', propResp);
          alert('Property not found on server. Cannot send OTP.');
          setOtpLoading(false);
          return;
        }
      } catch (preCheckErr) {
        console.error('Property pre-check error:', preCheckErr);
        alert(preCheckErr.message || 'Failed to verify property existence.');
        setOtpLoading(false);
        return;
      }

      // Call API to send OTP to Email using the otpApi utility
      let data;
      try {
        data = await otpApi.sendEmailOTPContact(ownerContactForm.email, propertyId);
      } catch (apiErr) {
        console.error('OTP API error response:', apiErr);
        // ApiClient throws Error with message property set to server message
        alert(apiErr.message || 'Failed to send OTP. Please try again.');
        setOtpLoading(false);
        return;
      }
      
      if (data.success) {
        setShowOwnerContactModal(false);
        setShowOTPModal(true);
        alert('OTP sent to your email address!');
        // For development testing - show OTP in console
        if (data.otp) {
          console.log('🔢 Development OTP:', data.otp);
        }
      } else {
        alert(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP (unexpected):', error);
      alert(error.message || 'Failed to send OTP. Please check your internet connection and try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otpForm.otp || otpForm.otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setOtpVerifying(true);
      
      // Get current user ID from localStorage if available
      let userId = null;
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId || payload.id;
        }
      } catch (tokenError) {
        console.log('No valid token found for notifications');
      }
      
      // Call API to verify OTP and get owner details using otpApi utility
      const propertyId = id || property?._id;
      console.log('Verifying contact OTP for propertyId:', propertyId);
      const data = await otpApi.verifyEmailOTPContact(
        ownerContactForm.email,
        otpForm.otp,
        propertyId,
        userId
      );
      
      if (data.success) {
        setOwnerDetails(data.ownerDetails);
        setShowOTPModal(false);
        setShowOwnerDetailsModal(true);
        
        // Record activity for viewing contact details
        if (property) {
          activityManager.addActivity(
            activityTypes.VIEWED_CONTACT,
            id,
            property.title,
            `${property.location?.area}, ${property.location?.district}`,
            { ownerContact: data.ownerDetails?.phone || 'Contact details accessed' }
          );
        }
        
        // Reset forms
        setOwnerContactForm({ email: '' });
        setOtpForm({ otp: '' });
      } else {
        alert(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert(error.response?.data?.message || error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show copied message
    }
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      setFavoriteLoading(true);
      
      // Try backend API first
      try {
        if (isFavorited) {
          // Remove from favorites
          const response = await propertyApi.removeFromFavorites(id);
          if (response.success) {
            setIsFavorited(false);
            alert('Property removed from favorites!');
            
            // Record activity
            if (property) {
              activityManager.addActivity(
                activityTypes.REMOVED_FAVORITE,
                id,
                property.title,
                `${property.location?.area}, ${property.location?.district}`
              );
            }
            
            return;
          } else {
            throw new Error(response.message || 'Failed to remove from favorites');
          }
        } else {
          // Add to favorites
          const response = await propertyApi.addToFavorites(id);
          if (response.success) {
            setIsFavorited(true);
            alert('Property added to favorites!');
            
            // Record activity
            if (property) {
              activityManager.addActivity(
                activityTypes.SAVED_PROPERTY,
                id,
                property.title,
                `${property.location?.area}, ${property.location?.district}`
              );
            }
            
            return;
          } else {
            throw new Error(response.message || 'Failed to add to favorites');
          }
        }
      } catch (apiError) {
        console.log('Favorites API not available, using local storage fallback');
        
        // Fallback to local storage using utility
        if (isFavorited) {
          // Remove from local storage
          const success = localFavoritesManager.removeFavorite(id);
          if (success) {
            setIsFavorited(false);
            alert('Property removed from favorites! (Saved locally)');
            
            // Record activity
            if (property) {
              activityManager.addActivity(
                activityTypes.REMOVED_FAVORITE,
                id,
                property.title,
                `${property.location?.area}, ${property.location?.district}`
              );
            }
            
          } else {
            throw new Error('Failed to remove from local favorites');
          }
        } else {
          // Add to local storage
          const success = localFavoritesManager.addFavorite(id);
          if (success) {
            setIsFavorited(true);
            alert('Property added to favorites! (Saved locally)');
            
            // Record activity
            if (property) {
              activityManager.addActivity(
                activityTypes.SAVED_PROPERTY,
                id,
                property.title,
                `${property.location?.area}, ${property.location?.district}`
              );
            }
            
          } else {
            alert('Property is already in favorites!');
          }
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status. Please try again.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Nearby amenities functionality
  const fetchNearbyAmenities = async (lat, lng) => {
    setAmenitiesLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        // Fallback with mock data for demo purposes
        const mockAmenities = [
          {
            type: 'Hospitals',
            amenities: [
              { id: '1', name: 'City General Hospital', rating: 4.2, distance: 0.8, address: 'Main Road, City Center', icon: 'hospital' },
              { id: '2', name: 'Apollo Healthcare', rating: 4.5, distance: 1.2, address: 'Health Street, Medical District', icon: 'hospital' }
            ]
          },
          {
            type: 'Schools',
            amenities: [
              { id: '3', name: 'St. Mary\'s High School', rating: 4.3, distance: 0.6, address: 'Education Lane', icon: 'school' },
              { id: '4', name: 'Green Valley Public School', rating: 4.1, distance: 0.9, address: 'School Road', icon: 'school' }
            ]
          },
          {
            type: 'Shopping Malls',
            amenities: [
              { id: '5', name: 'City Mall', rating: 4.0, distance: 1.5, address: 'Shopping Complex', icon: 'mall' },
              { id: '6', name: 'Metro Plaza', rating: 4.2, distance: 2.0, address: 'Metro Station Road', icon: 'mall' }
            ]
          },
          {
            type: 'Restaurants',
            amenities: [
              { id: '7', name: 'Taste of India', rating: 4.4, distance: 0.3, address: 'Food Court, Ground Floor', icon: 'restaurant' },
              { id: '8', name: 'Pizza Corner', rating: 4.1, distance: 0.5, address: 'Main Street', icon: 'restaurant' }
            ]
          }
        ];
        
        // Simulate loading time
        setTimeout(() => {
          setNearbyAmenities(mockAmenities);
          setAmenitiesLoading(false);
        }, 1500);
        return;
      }

      // Using Google Places API to find nearby amenities
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      const location = new google.maps.LatLng(lat, lng);
      
      const amenityTypes = [
        { type: 'hospital', icon: 'hospital', name: 'Hospitals' },
        { type: 'school', icon: 'school', name: 'Schools' },
        { type: 'university', icon: 'university', name: 'Universities' },
        { type: 'shopping_mall', icon: 'mall', name: 'Shopping Malls' },
        { type: 'gas_station', icon: 'fuel', name: 'Gas Stations' },
        { type: 'restaurant', icon: 'restaurant', name: 'Restaurants' },
        { type: 'subway_station', icon: 'metro', name: 'Metro Stations' }
      ];

      const promises = amenityTypes.map(amenityType => {
        return new Promise((resolve) => {
          const request = {
            location: location,
            radius: 2000, // 2km radius
            type: amenityType.type
          };

          service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              const amenities = results.slice(0, 3).map(place => ({
                id: place.place_id,
                name: place.name,
                rating: place.rating || 'N/A',
                distance: calculateDistance(lat, lng, place.geometry.location.lat(), place.geometry.location.lng()),
                type: amenityType.name,
                icon: amenityType.icon,
                address: place.vicinity || 'Address not available'
              }));
              resolve({ type: amenityType.name, amenities });
            } else {
              resolve({ type: amenityType.name, amenities: [] });
            }
          });
        });
      });

      const results = await Promise.all(promises);
      setNearbyAmenities(results);
    } catch (error) {
      console.error('Error fetching nearby amenities:', error);
      setNearbyAmenities([]);
    } finally {
      setAmenitiesLoading(false);
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const handleShowAmenities = async () => {
    try {
      setShowAmenitiesMap(true);
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        // Use mock data - no need to load Google Maps
        fetchNearbyAmenities(0, 0); // lat/lng not needed for mock data
        return;
      }

      // Load Google Maps script first
      await loadGoogleMapsScript();
      
      if (property.location && property.location.coordinates) {
        const [lng, lat] = property.location.coordinates;
        fetchNearbyAmenities(lat, lng);
      } else {
        // Fallback: try to geocode the address
        geocodeAddress(property.address);
      }
    } catch (error) {
      console.error('Error loading amenities:', error);
      // Still show modal with mock data as fallback
      fetchNearbyAmenities(0, 0);
    }
  };

  const geocodeAddress = async (address) => {
    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          setShowAmenitiesMap(true);
          fetchNearbyAmenities(lat, lng);
        } else {
          console.error('Geocoding failed:', status);
        }
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  };

  const nextMedia = () => {
    setCurrentMediaIndex((prev) =>
      prev === mediaItems.length - 1 ? 0 : prev + 1
    );
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) =>
      prev === 0 ? mediaItems.length - 1 : prev - 1
    );
  };

  const openMediaModal = (index = currentMediaIndex) => {
    setCurrentMediaIndex(index);
    setShowMediaModal(true);
  };

  const closeMediaModal = () => {
    setShowMediaModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Property not found'}</h1>
            <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/properties')}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-blue-600 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to listings
          </button>
          
          {/* Property Title and Price Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                {property.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{property.location?.address || `${property.location?.area}, ${property.location?.district || property.location?.city}, ${property.location?.state} - ${property.location?.pincode}`}</span>
                </div>
                <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.verificationStatus)}`}>
                  {getStatusIcon(property.verificationStatus)}
                  <span className="ml-1 capitalize">{property.verificationStatus}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between lg:justify-end gap-4">
              <div className="text-right">
                <div className="flex items-center text-3xl lg:text-4xl font-bold text-green-600 mb-1">
                  <IndianRupee className="h-8 w-8 mr-1" />
                  <span>{getPriceDisplay(property)}</span>
                </div>
                {property.priceNegotiable && (
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Negotiable
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  className={`p-3 border border-gray-300 rounded-xl transition-all duration-200 ${
                    favoriteLoading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-red-50 hover:border-red-300'
                  }`}
                >
                  {favoriteLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                  ) : (
                    <Heart className={`h-5 w-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 border border-gray-300 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  <Share2 className="h-5 w-5 text-gray-400 hover:text-blue-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            {/* Media Gallery */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="relative">
                {mediaItems.length > 0 ? (
                  <>
                    <div 
                      className="relative h-96 sm:h-[500px] cursor-pointer bg-gradient-to-br from-gray-100 to-gray-200"
                      onClick={() => openMediaModal()}
                    >
                      {mediaItems[currentMediaIndex].type === 'image' ? (
                        <img
                          src={getImageSrc(mediaItems[currentMediaIndex].data)}
                          alt={`${property.title} ${currentMediaIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={getVideoSrc(mediaItems[currentMediaIndex].data)}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                          controls={false}
                          onError={(e) => {
                            console.error('Video failed to load in details:', e);
                            const fallbackDiv = document.createElement('div');
                            fallbackDiv.className = 'flex items-center justify-center w-full h-full bg-gray-100 text-gray-500';
                            fallbackDiv.innerHTML = '<p>Video failed to load</p>';
                            e.target.parentNode.replaceChild(fallbackDiv, e.target);
                          }}
                          onLoadStart={() => {
                            console.log('Video loading started in details');
                          }}
                          onCanPlay={() => {
                            console.log('Video can play in details');
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}

                      {mediaItems.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevMedia();
                            }}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg z-10 transition-all duration-200"
                          >
                            <ChevronLeft className="h-5 w-5 text-gray-700" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextMedia();
                            }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg z-10 transition-all duration-200"
                          >
                            <ChevronRight className="h-5 w-5 text-gray-700" />
                          </button>
                        </>
                      )}

                      {/* Media Counter */}
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                        {currentMediaIndex + 1} / {mediaItems.length}
                      </div>

                      {/* Play icon overlay for videos */}
                      {mediaItems[currentMediaIndex].type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <PlayCircle className="h-20 w-20 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {mediaItems.length > 1 && (
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50">
                        <div className="flex space-x-3 overflow-x-auto">
                          {mediaItems.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setCurrentMediaIndex(index);
                              }}
                              className={`flex-shrink-0 h-16 w-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                index === currentMediaIndex 
                                  ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              {item.type === 'image' ? (
                                <img
                                  src={getImageSrc(item.data)}
                                  alt={`${property.title} ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <>
                                  <video
                                    src={getVideoSrc(item.data)}
                                    className="w-full h-full object-cover"
                                    muted
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <PlayCircle className="h-6 w-6 text-white" />
                                  </div>
                                </>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-96 sm:h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">No media available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Property Quick Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Property Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {(property.bedrooms || property.features?.bedrooms) && (
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3 shadow-md">
                      <Bed className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Bedrooms</div>
                    <div className="font-bold text-lg text-gray-900">{property.bedrooms || property.features?.bedrooms}</div>
                  </div>
                )}
                
                {(property.bathrooms || property.features?.bathrooms) && (
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mx-auto mb-3 shadow-md">
                      <Bath className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Bathrooms</div>
                    <div className="font-bold text-lg text-gray-900">{property.bathrooms || property.features?.bathrooms}</div>
                  </div>
                )}
                
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3 shadow-md">
                    <Square className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-sm text-gray-600 mb-1">Area</div>
                  <div className="font-bold text-lg text-gray-900">{property.area || property.squareFeet} {property.areaUnit || 'sq ft'}</div>
                </div>
                
                {(property.parking || property.features?.parking) && (
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full mx-auto mb-3 shadow-md">
                      <Car className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Parking</div>
                    <div className="font-bold text-lg text-gray-900">
                      {typeof (property.parking || property.features?.parking) === 'boolean' 
                        ? ((property.parking || property.features?.parking) ? 'Available' : 'Not Available')
                        : (property.parking || property.features?.parking)
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                Description
              </h2>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                  {property.description}
                </p>
              </div>
            </div>

            {/* Amenities */}
            {(property.amenities || property.features?.amenities) && (property.amenities || property.features?.amenities).length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
                  Amenities & Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(property.amenities || property.features?.amenities).map((amenity, index) => (
                    <div key={index} className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="capitalize text-gray-700 font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
                Property Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Property Type</span>
                  <div className="font-bold text-lg text-gray-900 capitalize mt-1">{property.type}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-green-50 rounded-xl border border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Survey Number</span>
                  <div className="font-bold text-lg text-gray-900 mt-1">{property.surveyNumber || 'N/A'}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Listing Type</span>
                  <div className="font-bold text-lg text-gray-900 capitalize mt-1">{property.listingType || 'Sale'}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl border border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Property Age</span>
                  <div className="font-bold text-lg text-gray-900 mt-1">{property.yearBuilt ? new Date().getFullYear() - property.yearBuilt : 'N/A'} years</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Posted on</span>
                  <div className="font-bold text-lg text-gray-900 mt-1">
                    {new Date(property.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-pink-50 rounded-xl border border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Status</span>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(property.verificationStatus)}`}>
                    {getStatusIcon(property.verificationStatus)}
                    <span className="ml-1 capitalize">{property.verificationStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Card - Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-28">
              {/* Agent Profile */}
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-6 mb-4">
                  <h3 className="font-bold text-2xl text-gray-900 mb-2">
                    {property.uploadedBy?.name || property.agent?.name || 'Property Agent'}
                  </h3>
                  <p className="text-sm text-indigo-700 bg-indigo-200 px-4 py-2 rounded-full inline-block font-semibold">
                    Real Estate Agent
                  </p>
                </div>
              </div>

              {/* Contact Buttons */}
              <div className="space-y-4 mb-6">
                {(property.uploadedBy?.phone || property.agent?.phone) && (
                  <a
                    href={`tel:${property.uploadedBy?.phone || property.agent?.phone}`}
                    className="w-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold hover:from-green-500 hover:via-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-green-300 hover:border-green-400"
                  >
                    <Phone className="h-5 w-5 mr-3" />
                    📞 Call Agent Now
                  </a>
                )}
                
                <button 
                  onClick={handleOwnerContactRequest}
                  className="w-full bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 text-white py-4 px-6 rounded-xl font-bold hover:from-orange-500 hover:via-red-600 hover:to-pink-700 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-orange-300 hover:border-red-400"
                >
                  <Mail className="h-5 w-5 mr-3" />
                  📧 Contact Owner
                </button>
              </div>

              {/* Property Summary */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">Property Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg border-l-4 border-blue-500">
                    <span className="text-blue-800 font-semibold">Type:</span>
                    <span className="font-bold text-blue-900 capitalize">{property.type}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-l-4 border-green-500">
                    <span className="text-green-800 font-semibold">Price:</span>
                    <span className="font-bold text-green-700">₹{property.price?.toLocaleString()}</span>
                  </div>
                  {property.area && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-l-4 border-purple-500">
                      <span className="text-purple-800 font-semibold">Area:</span>
                      <span className="font-bold text-purple-900">{property.area} sq ft</span>
                    </div>
                  )}
                  {property.bedrooms && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border-l-4 border-orange-500">
                      <span className="text-orange-800 font-semibold">Bedrooms:</span>
                      <span className="font-bold text-orange-900">{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-lg border-l-4 border-indigo-500">
                      <span className="text-indigo-800 font-semibold">Bathrooms:</span>
                      <span className="font-bold text-indigo-900">{property.bathrooms}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-6 border-t border-gray-200 mt-6">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center transform hover:scale-105 ${
                      favoriteLoading
                        ? 'opacity-50 cursor-not-allowed border-gray-300 bg-gray-100'
                        : isFavorited 
                        ? 'border-red-400 bg-gradient-to-br from-red-50 to-pink-50 text-red-600 shadow-lg' 
                        : 'border-gray-300 bg-gradient-to-br from-gray-50 to-red-50 text-gray-600 hover:border-red-400 hover:text-red-600'
                    }`}
                  >
                    {favoriteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mb-2"></div>
                        <span className="text-sm font-bold">Loading...</span>
                      </>
                    ) : (
                      <>
                        <Heart className={`h-6 w-6 mb-2 ${isFavorited ? 'fill-current' : ''}`} />
                        <span className="text-sm font-bold">{isFavorited ? 'Saved' : 'Save'}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-4 rounded-xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 text-gray-600 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 transition-all duration-300 flex flex-col items-center transform hover:scale-105"
                  >
                    <Share2 className="h-6 w-6 mb-2" />
                    <span className="text-sm font-bold">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeMediaModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <X className="h-8 w-8" />
            </button>

            {mediaItems[currentMediaIndex].type === 'image' ? (
              <img
                src={getImageSrc(mediaItems[currentMediaIndex].data)}
                alt={`${property.title} ${currentMediaIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  key={currentMediaIndex} // Force re-render when media changes
                  src={getVideoSrc(mediaItems[currentMediaIndex].data)}
                  className="max-w-full max-h-full object-contain"
                  controls
                  preload="metadata"
                  onError={(e) => {
                    console.error('Video failed to load in modal:', e);
                    console.error('Video src:', e.target.src);
                    console.error('Video error code:', e.target.error?.code);
                    console.error('Video error message:', e.target.error?.message);

                    // Replace video with error message (similar to main gallery)
                    const container = e.target.parentNode;
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'flex items-center justify-center w-full h-full bg-gray-100 text-gray-500';
                    errorDiv.innerHTML = `
                      <div class="text-center">
                        <svg class="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="text-lg font-medium">Video failed to load</p>
                        <p class="text-sm mt-2">The video file may be corrupted or unsupported</p>
                      </div>
                    `;
                    container.replaceChild(errorDiv, e.target);
                  }}
                  onLoadStart={() => {
                    console.log('Video loading started in modal');
                  }}
                  onCanPlay={() => {
                    console.log('Video can play in modal');
                  }}
                  onLoadedData={() => {
                    console.log('Video data loaded in modal');
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-3"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-3"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </>
            )}

            {/* Media Counter */}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentMediaIndex + 1} / {mediaItems.length}
            </div>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Contact Agent</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="I'm interested in this property..."
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owner Contact Request Modal */}
      {showOwnerContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Contact Property Owner</h3>
              <button
                onClick={() => setShowOwnerContactModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-4">
                To protect owner privacy, we'll send an OTP to your Email Address before showing owner contact details.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Email Verification</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      We'll send a 6-digit OTP to your email address to verify your identity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email Address
                </label>
                <input
                  type="email"
                  value={ownerContactForm.email}
                  onChange={(e) => {
                    setOwnerContactForm(prev => ({ ...prev, email: e.target.value }));
                  }}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll send OTP to this email address
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOwnerContactModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || !ownerContactForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerContactForm.email)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {otpLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send OTP
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Verify WhatsApp OTP</h3>
              <button
                onClick={() => setShowOTPModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900">OTP Sent!</h4>
                    <p className="text-xs text-green-700 mt-1">
                      We've sent a 6-digit OTP to {ownerContactForm.email}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Please check your email and enter the OTP below to get owner contact details.
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otpForm.otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    if (value.length <= 6) {
                      setOtpForm(prev => ({ ...prev, otp: value }));
                    }
                  }}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-lg tracking-widest"
                  required
                  maxLength="6"
                  pattern="[0-9]{6}"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowOTPModal(false);
                    setShowOwnerContactModal(true);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={otpVerifying || otpForm.otp.length !== 6}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {otpVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={handleSendOTP}
                className="text-sm text-primary-600 hover:text-primary-700"
                disabled={otpLoading}
              >
                {otpLoading ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Details Modal */}
      {showOwnerDetailsModal && ownerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Owner Contact Details</h3>
              <button
                onClick={() => setShowOwnerDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="text-sm font-medium text-green-900">Verification Successful!</h4>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-xl font-bold text-orange-600">
                    {ownerDetails.name ? ownerDetails.name.charAt(0).toUpperCase() : 'O'}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Property Owner</h4>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Owner Name</div>
                  <div className="font-semibold text-gray-900">{ownerDetails.name}</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Phone Number</div>
                  <div className="font-semibold text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <a href={`tel:${ownerDetails.phone}`} className="text-primary-600 hover:text-primary-700">
                      {ownerDetails.phone}
                    </a>
                  </div>
                </div>
                
                {ownerDetails.email && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Email</div>
                    <div className="font-semibold text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${ownerDetails.email}`} className="text-primary-600 hover:text-primary-700">
                        {ownerDetails.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={`tel:${ownerDetails.phone}`}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Owner Now
              </a>
              
              <button
                onClick={() => setShowOwnerDetailsModal(false)}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nearby Amenities Modal */}
      {showAmenitiesMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Map className="h-6 w-6 mr-2 text-blue-500" />
                  Nearby Amenities
                </h2>
                <p className="text-gray-600 mt-1">Discover what's around this property</p>
              </div>
              <button
                onClick={() => setShowAmenitiesMap(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {amenitiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading nearby amenities...</p>
                  </div>
                </div>
              ) : nearbyAmenities.length > 0 ? (
                <div className="space-y-6">
                  {nearbyAmenities.map((category, index) => (
                    category.amenities.length > 0 && (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          {category.type === 'Hospitals' && <Hospital className="h-5 w-5 text-red-500 mr-2" />}
                          {category.type === 'Schools' && <GraduationCap className="h-5 w-5 text-green-500 mr-2" />}
                          {category.type === 'Universities' && <GraduationCap className="h-5 w-5 text-blue-500 mr-2" />}
                          {category.type === 'Shopping Malls' && <ShoppingBag className="h-5 w-5 text-purple-500 mr-2" />}
                          {category.type === 'Gas Stations' && <Fuel className="h-5 w-5 text-orange-500 mr-2" />}
                          {category.type === 'Restaurants' && <Coffee className="h-5 w-5 text-brown-500 mr-2" />}
                          {category.type === 'Metro Stations' && <Train className="h-5 w-5 text-blue-600 mr-2" />}
                          <h3 className="text-lg font-semibold text-gray-800">{category.type}</h3>
                          <span className="ml-auto text-sm text-gray-500">({category.amenities.length} found)</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {category.amenities.map((amenity) => (
                            <div key={amenity.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-sm leading-tight">{amenity.name}</h4>
                                <div className="flex items-center text-xs text-gray-500 ml-2">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {amenity.distance}km
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{amenity.address}</p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-xs">
                                  {amenity.rating !== 'N/A' ? (
                                    <>
                                      <span className="text-yellow-500">★</span>
                                      <span className="ml-1 text-gray-600">{amenity.rating}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">No rating</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Map className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Amenities Found</h3>
                  <p className="text-gray-500">We couldn't find any amenities near this location.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;