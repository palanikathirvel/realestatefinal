import React from 'react';
import { Search, IndianRupee, X } from 'lucide-react';

const FilterSidebar = ({ 
  filters, 
  onFilterChange, 
  onApplyFilters, 
  onClearFilters, 
  showFilters, 
  onClose,
  propertyType = 'all' // 'all', 'land', 'rental', 'house'
}) => {
  const locations = [
    'Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli',
    'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Kanchipuram'
  ];

  const propertyTypes = [
    { value: 'land', label: 'Land' },
    { value: 'house', label: 'House' },
    { value: 'rental', label: 'Rental' }
  ];

  const priceRanges = [
    { value: '0-500000', label: 'Under ₹5 Lakh', min: 0, max: 500000 },
    { value: '500000-1000000', label: '₹5L - ₹10L', min: 500000, max: 1000000 },
    { value: '1000000-2500000', label: '₹10L - ₹25L', min: 1000000, max: 2500000 },
    { value: '2500000-5000000', label: '₹25L - ₹50L', min: 2500000, max: 5000000 },
    { value: '5000000-10000000', label: '₹50L - ₹1Cr', min: 5000000, max: 10000000 },
    { value: '10000000-99999999', label: 'Above ₹1Cr', min: 10000000, max: 99999999 }
  ];

  const rentalRanges = [
    { value: '0-10000', label: 'Under ₹10K', min: 0, max: 10000 },
    { value: '10000-20000', label: '₹10K - ₹20K', min: 10000, max: 20000 },
    { value: '20000-30000', label: '₹20K - ₹30K', min: 20000, max: 30000 },
    { value: '30000-50000', label: '₹30K - ₹50K', min: 30000, max: 50000 },
    { value: '50000-100000', label: '₹50K - ₹1L', min: 50000, max: 100000 },
    { value: '100000-999999', label: 'Above ₹1L', min: 100000, max: 999999 }
  ];

  const currentPriceRanges = propertyType === 'rental' ? rentalRanges : priceRanges;

  return (
    <>
      {/* Mobile Overlay */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button onClick={onClose} className="p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterContent 
                filters={filters}
                onFilterChange={onFilterChange}
                onApplyFilters={onApplyFilters}
                onClearFilters={onClearFilters}
                propertyType={propertyType}
                locations={locations}
                propertyTypes={propertyTypes}
                currentPriceRanges={currentPriceRanges}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={onClearFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear All
            </button>
          </div>
          <FilterContent 
            filters={filters}
            onFilterChange={onFilterChange}
            onApplyFilters={onApplyFilters}
            onClearFilters={onClearFilters}
            propertyType={propertyType}
            locations={locations}
            propertyTypes={propertyTypes}
            currentPriceRanges={currentPriceRanges}
          />
        </div>
      </div>
    </>
  );
};

const FilterContent = ({ 
  filters, 
  onFilterChange, 
  onApplyFilters, 
  onClearFilters, 
  propertyType,
  locations,
  propertyTypes,
  currentPriceRanges
}) => {
  return (
    <div className="space-y-6">
      {/* Property Category - only show if on main properties page */}
      {propertyType === 'all' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Category
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            <option value="house">Home</option>
            <option value="land">Land</option>
            <option value="rental">Rental</option>
          </select>
        </div>
      )}

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <select
          value={filters.location || ''}
          onChange={(e) => onFilterChange('location', e.target.value)}
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-2"
        >
          <option value="">All Locations</option>
          {locations.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
        <input
          type="text"
          value={filters.location || ''}
          onChange={(e) => onFilterChange('location', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          placeholder="Or enter custom location..."
        />
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {propertyType === 'rental' ? 'Monthly Rent' : 'Price Range'}
        </label>
        <select
          value={`${filters.minPrice || ''}-${filters.maxPrice || ''}`}
          onChange={(e) => {
            const selectedRange = currentPriceRanges.find(range => range.value === e.target.value);
            if (selectedRange) {
              onFilterChange('minPrice', selectedRange.min.toString());
              onFilterChange('maxPrice', selectedRange.max.toString());
            } else {
              onFilterChange('minPrice', '');
              onFilterChange('maxPrice', '');
            }
          }}
          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="-">All Price Ranges</option>
          {currentPriceRanges.map(range => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={filters.minPrice || ''}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="Custom Min"
            />
          </div>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="Custom Max"
            />
          </div>
        </div>
      </div>

      {/* Apply Filters Button */}
      <button
        onClick={onApplyFilters}
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default FilterSidebar;