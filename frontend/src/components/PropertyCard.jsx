import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  IndianRupee,
  Heart,
  CheckCircle,
  Clock,
  AlertCircle,
  Droplets,
  Zap,
  Building2,
  Compass,
  Home,
  PlayCircle
} from 'lucide-react';
import { getImageSrc, getVideoSrc } from '../utils/imageUtils';

const PropertyCard = ({ 
  property, 
  onFavoriteToggle, 
  isFavorited = false,
  showStatus = true 
}) => {
  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(1)} L`;
    } else {
      return price.toLocaleString();
    }
  };

  const getPriceDisplay = (property) => {
    if (property.type === 'rental' && property.monthlyPayment?.amount) {
      return (
        <div className="flex items-center text-2xl font-bold text-primary-600">
          <IndianRupee className="h-5 w-5" />
          <span>{formatPrice(property.monthlyPayment.amount)}</span>
          <span className="ml-1 text-sm font-normal text-gray-600">/ month</span>
        </div>
      );
    }
    if (property.type === 'land' && property.pricePerAcre) {
      return (
        <div className="text-2xl font-bold text-primary-600">
          <div>Total: <IndianRupee className="inline h-5 w-5" />{formatPrice(property.price)}</div>
          <div className="text-sm text-gray-600">({formatPrice(property.pricePerAcre)} / acre)</div>
        </div>
      );
    }
    return (
      <div className="flex items-center text-2xl font-bold text-primary-600">
        <IndianRupee className="h-5 w-5" />
        <span>{formatPrice(property.price)}</span>
      </div>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Under Review';
      case 'rejected':
        return 'Needs Attention';
      default:
        return '';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasVideo = !!property.video;
  const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xOTQuMjUgMTEwLjI1TDE5NC4yNSAxMzguMjVMMjA1Ljc1IDEzOC4yNUwyMDUuNzUgMTEwLjI1TDE5NC4yNSAxMTAuMjVaIiBmaWxsPSIjOUI5QkExIi8+CjxwYXRoIGQ9Ik0xODguNzUgMTIyLjI1TDE4OC43NSAxNDQuMjVMMjExLjI1IDE0NC4yNUwyMTEuMjUgMTIyLjI1TDE4OC43NSAxMjIuMjVaIiBmaWxsPSIjOUI5QkExIi8+CjxwYXRoIGQ9Ik0yMDAgMTA1VjE0NCIgc3Ryb2tlPSIjOUI5QkExIiBzdHJva2Utd2lkdGg9IjIiLz4KPHRleHQgeD0iMjAwIiB5PSIxNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlCOUJBMSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
  const posterSrc = property.images && property.images.length > 0 ? getImageSrc(property.images[0]) : placeholder;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Image Section */}
      <div className="relative">
        {hasVideo ? (
          <video
            src={getVideoSrc(property.video)}
            poster={posterSrc}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-48 object-cover"
            onError={(e) => {
              console.error('Video failed to load:', e);
              e.target.poster = placeholder;
              e.target.style.display = 'none';
              // Show fallback image
              const fallbackImg = document.createElement('img');
              fallbackImg.src = posterSrc;
              fallbackImg.className = 'w-full h-48 object-cover';
              e.target.parentNode.replaceChild(fallbackImg, e.target);
            }}
            onLoadStart={() => {
              console.log('Video loading started');
            }}
            onCanPlay={() => {
              console.log('Video can play');
            }}
          />
        ) : property.images && property.images.length > 0 ? (
          <img
            src={getImageSrc(property.images[0])}
            alt={property.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.src = placeholder;
            }}
          />
        ) : (
          <img
            src={placeholder}
            alt="No image"
            className="w-full h-48 object-cover"
          />
        )}
        
        {/* Favorite Button */}
        {onFavoriteToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(property._id);
            }}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200 z-10"
          >
            <Heart
              className={`h-4 w-4 transition-colors duration-200 ${
                isFavorited 
                  ? 'text-red-500 fill-current' 
                  : 'text-gray-400 hover:text-red-500'
              }`}
            />
          </button>
        )}

        {/* Property Type Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded capitalize">
            {property.type}
          </span>
        </div>

        {/* Video Badge */}
        {hasVideo && (
          <div className="absolute top-3 left-20 z-10">
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded flex items-center">
              <PlayCircle className="h-3 w-3 mr-1" />
              Video
            </span>
          </div>
        )}

        {/* Status Badge */}
        {showStatus && property.verificationStatus && (
          <div className="absolute bottom-3 right-3 z-10">
            <div className={`flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusBg(property.verificationStatus)}`}>
              {getStatusIcon(property.verificationStatus)}
              <span className="ml-1">{getStatusText(property.verificationStatus)}</span>
            </div>
          </div>
        )}

        {/* Play Overlay for Videos */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg pointer-events-none z-5">
            <PlayCircle className="h-16 w-16 text-white opacity-90 drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          {getPriceDisplay(property)}
          {property.priceNegotiable && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Negotiable
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm truncate">
            {property.location?.area}, {property.location?.district || property.location?.city}
          </span>
        </div>

        {/* Property Details */}
        <div className="text-sm text-gray-600 mb-4">
          {/* General Details */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              {(property.bedrooms || property.features?.bedrooms) && (
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1" />
                  <span>{property.bedrooms || property.features?.bedrooms} Beds</span>
                </div>
              )}
              {(property.bathrooms || property.features?.bathrooms) && (
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1" />
                  <span>{property.bathrooms || property.features?.bathrooms} Baths</span>
                </div>
              )}
              {(property.parking || property.features?.parking) && (
                <div className="flex items-center">
                  <Car className="h-4 w-4 mr-1" />
                  <span>{typeof property.parking === 'boolean' ? (property.parking ? 'Parking' : 'No Parking') : property.parking}</span>
                </div>
              )}
            </div>

            {(property.area || property.squareFeet) && (
              <div className="flex items-center">
                <Square className="h-4 w-4 mr-1" />
                <span>{property.area || property.squareFeet} sq ft</span>
              </div>
            )}
          </div>

          {/* Type-Specific Details */}
          {property.type === 'land' && (
            <div className="flex flex-wrap items-center space-x-2 mb-2">
              {property.surveyNumber && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Survey: {property.surveyNumber}</span>
              )}
              <div className="flex items-center space-x-1">
                {property.facilities?.waterNearby && <Droplets className="h-3 w-3 text-blue-500" />}
                {property.facilities?.electricity && <Zap className="h-3 w-3 text-yellow-500" />}
                {property.facilities?.nearbyBuildings && <Building2 className="h-3 w-3 text-gray-500" />}
                { (property.facilities?.waterNearby || property.facilities?.electricity || property.facilities?.nearbyBuildings) && (
                  <span className="text-xs">Facilities</span>
                )}
              </div>
            </div>
          )}

          {property.type === 'house' && (
            <div className="flex flex-wrap items-center space-x-2 mb-2 text-xs">
              {property.features?.rooms?.length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Rooms: {property.features.rooms.length}</span>
              )}
              {property.specifications?.gateDirection && (
                <div className="flex items-center">
                  <Compass className="h-3 w-3 mr-1" />
                  <span>Gate: {property.specifications.gateDirection}</span>
                </div>
              )}
              {property.features?.furnished && property.features.furnished !== 'unfurnished' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">{property.features.furnished} Furnished</span>
              )}
            </div>
          )}

          {property.type === 'rental' && (
            <div className="flex flex-wrap items-center space-x-2 mb-2 text-xs">
              {property.advancePayment?.amount > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">Advance: ₹{formatPrice(property.advancePayment.amount)}</span>
              )}
              {(property.rooms || property.features?.rooms)?.length > 0 && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded">
                  {(property.rooms || property.features?.rooms).map(r => r.type).join(', ')} Rooms
                </span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {property.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Posted {new Date(property.createdAt).toLocaleDateString()}
          </div>
          
          <Link
            to={`/property/${property._id}`}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;