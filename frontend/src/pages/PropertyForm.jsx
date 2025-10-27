import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { propertyApi } from '../utils/api';
import { uploadFile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const PropertyForm = ({ onSuccess }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const [formData, setFormData] = useState({
    type: 'land',
    title: '',
    description: '',
    surveyNumber: '',
    location: {
      district: '',
      taluk: '',
      area: '',
      address: '',
      pincode: '',
      coordinates: {
        latitude: '',
        longitude: ''
      }
    },
    squareFeet: '',
    price: '',
    acres: '',
    ownerDetails: {
      name: '',
      phone: '',
      email: '',
      alternatePhone: ''
    },
    features: {
      bedrooms: '',
      bathrooms: '',
      parking: false,
      furnished: '',
      amenities: [],
      // house-specific
      rooms: [],
      specialRooms: []
    },
    images: [],
    video: null,
    // land-specific
    pricePerAcre: '',
    facilities: {
      waterNearby: false,
      electricity: false,
      nearbyBuildings: false
    },
    // house-specific
    geoTagPhoto: null,
    specifications: {
      gateDirection: '',
      otherSpecs: {}
    },
    // rental-specific
    monthlyPayment: { amount: '' },
    rules: [],
    charges: [],
    agreementFile: null,
    advancePayment: { amount: '', refundable: false, returnRules: '' }
  });

  const [errors, setErrors] = useState({});
  const [newAmenity, setNewAmenity] = useState('');

  // URL validation function
  const isValidUrl = (string) => {
    if (string.startsWith('data:')) return true;
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Format price like in PropertyCard
  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(1)} L`;
    } else {
      return price.toLocaleString();
    }
  };

  useEffect(() => {
    if (formData.type === 'land') {
      const perAcre = parseFloat(formData.pricePerAcre) || 0;
      const ac = parseFloat(formData.acres) || 0;
      const total = perAcre * ac;
      setCalculatedPrice(total);
      setFormData(prev => ({ ...prev, price: total.toString() }));
    } else {
      setCalculatedPrice(0);
    }
  }, [formData.type, formData.pricePerAcre, formData.acres]);

  useEffect(() => {
    if (!isAuthenticated() || user.role !== 'agent') {
      navigate('/login');
      return;
    }

    if (isEdit) {
      fetchPropertyDetails();
    }
  }, [id, user, isAuthenticated, navigate]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await propertyApi.getPropertyById(id);

      if (response.success) {
        const property = response.data.property;
        setFormData({
          type: property.type || 'land',
          title: property.title || '',
          description: property.description || '',
          surveyNumber: property.surveyNumber || '',
          location: {
            district: property.location?.district || '',
            taluk: property.location?.taluk || '',
            area: property.location?.area || '',
            address: property.location?.address || '',
            pincode: property.location?.pincode || '',
            coordinates: {
              latitude: property.location?.coordinates?.latitude || '',
              longitude: property.location?.coordinates?.longitude || ''
            }
          },
          squareFeet: property.squareFeet || '',
          price: property.price || '',
          acres: property.acres || '',
          pricePerAcre: property.pricePerAcre || '',
          facilities: property.facilities || { waterNearby: false, electricity: false, nearbyBuildings: false },
          geoTagPhoto: property.geoTagPhoto ? { url: property.geoTagPhoto.url || property.geoTagPhoto.base64 } : null,
          agreementFile: property.agreement ? { url: property.agreement.url } : null,
          monthlyPayment: property.monthlyPayment || { amount: '' },
          rules: property.rules || [],
          advancePayment: property.advancePayment || { amount: '', refundable: false, returnRules: '' },
          ownerDetails: {
            name: property.ownerDetails?.name || '',
            phone: property.ownerDetails?.phone || '',
            email: property.ownerDetails?.email || ''
          },
          features: {
            bedrooms: property.features?.bedrooms || '',
            bathrooms: property.features?.bathrooms || '',
            parking: property.features?.parking || false,
            furnished: property.features?.furnished || '',
            amenities: property.features?.amenities || [],
            rooms: property.features?.rooms || [],
          specialRooms: property.features?.specialRooms?.map(r => typeof r === 'string' ? r : r.name) || []
          },
          images: property.images?.map(img => ({url: img.base64 || img.url, ...img})) || []
        });
        // Recalculate price for edit
        if (property.type === 'land' && property.pricePerAcre && property.acres) {
          const total = parseFloat(property.pricePerAcre) * parseFloat(property.acres);
          setCalculatedPrice(total);
        }
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageAdd = () => {
    // Trigger file input selection instead of URL prompt
    document.getElementById('property-image-input')?.click();
  };

  const handleGeoTagSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, geoTagPhoto: { file, preview: URL.createObjectURL(file) } }));
    e.target.value = '';
  };

  const handleAgreementSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, agreementFile: file }));
    e.target.value = '';
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve({ file, url: event.target.result });
        reader.readAsDataURL(file);
      });
    });

    const newImages = await Promise.all(promises);

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    // Clear the input so selecting the same file again will fire change
    e.target.value = '';
  };

  const handleImageRemove = (index) => {
    setFormData(prev => {
      const removed = prev.images[index];
      // No revocation needed for data URLs
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      };
    });
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Video file size must be less than 50MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        video: {
          file,
          url: event.target.result,
          name: file.name
        }
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoRemove = () => {
    setFormData(prev => ({ ...prev, video: null }));
  };

  const handleAmenityAdd = () => {
    if (newAmenity.trim() && !formData.features.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          amenities: [...prev.features.amenities, newAmenity.trim()]
        }
      }));
      setNewAmenity('');
    }
  };

  const handleAmenityRemove = (amenity) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        amenities: prev.features.amenities.filter(a => a !== amenity)
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation (5-100 characters)
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must not exceed 100 characters';
    }

    // Description validation (20-1000 characters)
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = 'Description must not exceed 1000 characters';
    }

    // Survey number validation (required for land only)
    if (formData.type === 'land' && !formData.surveyNumber.trim()) {
      newErrors.surveyNumber = 'Survey number is required for land';
    }

    if (!formData.location.district.trim()) newErrors['location.district'] = 'District is required';
    if (!formData.location.taluk.trim()) newErrors['location.taluk'] = 'Taluk is required';
    if (!formData.location.area.trim()) newErrors['location.area'] = 'Area is required';

    // Address validation (10-200 characters)
    if (!formData.location.address.trim()) {
      newErrors['location.address'] = 'Address is required';
    } else if (formData.location.address.trim().length < 10) {
      newErrors['location.address'] = 'Address must be at least 10 characters';
    } else if (formData.location.address.trim().length > 200) {
      newErrors['location.address'] = 'Address must not exceed 200 characters';
    }

    if (!formData.location.pincode.trim()) newErrors['location.pincode'] = 'Pincode is required';
    if (!formData.squareFeet || formData.squareFeet <= 0) newErrors.squareFeet = 'Valid square feet is required';

    // Price validation (required for non-rental only)
    if (formData.type !== 'rental') {
      if (formData.type === 'land') {
        if ((!formData.pricePerAcre || parseFloat(formData.pricePerAcre) <= 0) && (!formData.acres || parseFloat(formData.acres) <= 0)) {
          newErrors.pricePerAcre = 'Price per acre and acres are required for land';
        }
      } else if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = 'Valid price is required for non-rental properties';
      }
    }

    // For rental, validate monthly payment
    if (formData.type === 'rental' && (!formData.monthlyPayment?.amount || formData.monthlyPayment.amount <= 0)) {
      newErrors['monthlyPayment.amount'] = 'Monthly payment is required for rentals';
    }

    // Owner name validation (2-50 characters)
    if (!formData.ownerDetails.name.trim()) {
      newErrors['ownerDetails.name'] = 'Owner name is required';
    } else if (formData.ownerDetails.name.trim().length < 2) {
      newErrors['ownerDetails.name'] = 'Owner name must be at least 2 characters';
    } else if (formData.ownerDetails.name.trim().length > 50) {
      newErrors['ownerDetails.name'] = 'Owner name must not exceed 50 characters';
    }

    if (!formData.ownerDetails.phone.trim()) newErrors['ownerDetails.phone'] = 'Owner phone is required';

    // Phone validation
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (formData.ownerDetails.phone && !phoneRegex.test(formData.ownerDetails.phone)) {
      newErrors['ownerDetails.phone'] = 'Phone must be in format +91XXXXXXXXXX (starting with 6-9)';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.ownerDetails.email && formData.ownerDetails.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.ownerDetails.email)) {
        newErrors['ownerDetails.email'] = 'Please enter a valid email address';
      }
    }

    // Pincode validation
    if (formData.location.pincode && !/^\d{6}$/.test(formData.location.pincode)) {
      newErrors['location.pincode'] = 'Pincode must be exactly 6 digits';
    }

    // Image validation: at least one image required
    if (!formData.images || formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    // Image validation: skip validation for file uploads; only validate string URLs
    if (formData.images && formData.images.length > 0) {
      formData.images.forEach((img, index) => {
        if (typeof img === 'string') {
          if (img && img.trim() && !isValidUrl(img.trim())) {
            newErrors[`images.${index}`] = `Image ${index + 1} URL is not valid`;
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitLoading(true);

      const API_BASE = 'http://localhost:5000'; // Adjust if your backend URL differs; use process.env.REACT_APP_API_URL in production

      // Helper to make URL absolute
      const makeAbsoluteUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (url.startsWith('data:')) return url; // For local previews, but shouldn't reach here
        return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
      };

      // Transform images to proper format and clean up data
      const transformedData = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: {
          district: formData.location.district.trim(),
          taluk: formData.location.taluk.trim(),
          area: formData.location.area.trim(),
          address: formData.location.address.trim(),
          pincode: formData.location.pincode.trim()
        },
        squareFeet: parseInt(formData.squareFeet),
        ownerDetails: {
          name: formData.ownerDetails.name.trim(),
          phone: formData.ownerDetails.phone.trim()
        }
      };

      // Add surveyNumber only for land
      if (formData.type === 'land') {
        transformedData.surveyNumber = formData.surveyNumber.trim();
      }

      // Add price only for non-rental
      if (formData.type !== 'rental') {
      if (formData.type === 'land') {
        transformedData.pricePerAcre = parseFloat(formData.pricePerAcre);
        transformedData.price = calculatedPrice;
      } else {
        transformedData.price = parseInt(formData.price);
      }
      }
      // Handle images: upload any selected files first, then include URLs
      if (formData.images && formData.images.length > 0) {
        const finalImages = [];

        // First keep any existing URL strings or objects with url but no file (from edit)
        formData.images.forEach(item => {
          let url;
          if (typeof item === 'string') {
            url = item.trim();
          } else if (item && typeof item === 'object' && item.url && !item.file) {
            url = item.url;
          }
          if (url) {
            const fullUrl = makeAbsoluteUrl(url);
            finalImages.push({ url: fullUrl, caption: `Image ${finalImages.length + 1}`, isPrimary: finalImages.length === 0 });
          }
        });

        // Then upload any new files
        for (const item of formData.images) {
          if (item && item.file) {
            try {
              const uploadRes = await uploadFile(item.file);
              // uploadFile returns server response data; support base64 from our controller
              let uploadedUrl = uploadRes?.file?.base64 || uploadRes?.file?.url || uploadRes?.url || uploadRes?.data?.url || uploadRes?.fileUrl;
              if (uploadedUrl) {
                const fullUrl = makeAbsoluteUrl(uploadedUrl);
                finalImages.push({ url: fullUrl, caption: item.file.name || `Image ${finalImages.length + 1}`, isPrimary: finalImages.length === 0 });
              }
              else {
                console.error('Upload did not return a URL/base64 for', item.file.name, uploadRes);
              }
            } catch (upErr) {
              console.error('Image upload failed:', upErr);
              alert(`Failed to upload image ${item.file.name}: ${upErr.message || upErr}`);
              setSubmitLoading(false);
              return;
            }
          }
        }

        // Sanity check: make sure all image urls are valid before sending
        const invalidImages = finalImages.filter(img => {
          try {
            new URL(img.url);
            return false;
          } catch {
            return true;
          }
        });
        if (invalidImages.length > 0) {
          console.error('Invalid image URLs found, aborting submit:', invalidImages);
          alert('One or more images failed to upload correctly. Please remove and re-add them, then try again.');
          setSubmitLoading(false);
          return;
        }

        if (finalImages.length > 0) transformedData.images = finalImages;
      }

      // Handle video (send base64 directly, no file upload)
      if (formData.video) {
        transformedData.video = { url: formData.video.url, caption: formData.video.name || 'Property Video' };
      }

      // Upload geoTagPhoto for house
      if (formData.geoTagPhoto && formData.geoTagPhoto.file) {
        try {
          const res = await uploadFile(formData.geoTagPhoto.file);
          let url = res?.file?.base64 || res?.file?.url || res?.url || res?.data?.url || res?.fileUrl;
          if (url) {
            url = makeAbsoluteUrl(url);
            transformedData.geoTagPhoto = { url };
          } else throw new Error('GeoTag upload returned no URL/base64');
        } catch (err) {
          alert('GeoTag photo upload failed. Please try again.');
          setSubmitLoading(false);
          return;
        }
      }

      // Upload agreement file for rental
      if (formData.agreementFile) {
        try {
          const res = await uploadFile(formData.agreementFile);
          let url = res?.file?.base64 || res?.file?.url || res?.url || res?.data?.url || res?.fileUrl;
          if (url) {
            url = makeAbsoluteUrl(url);
            transformedData.agreement = { url, uploadedAt: new Date() };
          } else throw new Error('Agreement upload returned no URL/base64');
        } catch (err) {
          alert('Agreement upload failed. Please try again.');
          setSubmitLoading(false);
          return;
        }
      }

      // Add coordinates only if they have valid values
      if (formData.location.coordinates.latitude && formData.location.coordinates.longitude) {
        const lat = parseFloat(formData.location.coordinates.latitude);
        const lng = parseFloat(formData.location.coordinates.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          transformedData.location.coordinates = {
            latitude: lat,
            longitude: lng
          };
        }
      }

      // Add owner email only if provided
      if (formData.ownerDetails.email && formData.ownerDetails.email.trim()) {
        transformedData.ownerDetails.email = formData.ownerDetails.email.trim();
      }

      // Only include features if they have values (to avoid undefined issues)
      // Only add features for house and rental types
      if (formData.type === 'house' || formData.type === 'rental') {
        const features = {};
        if (formData.features.bedrooms && parseInt(formData.features.bedrooms) > 0) {
          features.bedrooms = parseInt(formData.features.bedrooms);
        }
        if (formData.features.bathrooms && parseInt(formData.features.bathrooms) > 0) {
          features.bathrooms = parseInt(formData.features.bathrooms);
        }
        if (formData.features.parking === true || formData.features.parking === false) {
          features.parking = formData.features.parking;
        }
        if (formData.features.furnished && ['unfurnished', 'semi-furnished', 'fully-furnished'].includes(formData.features.furnished)) {
          features.furnished = formData.features.furnished;
        }
        if (formData.features.amenities && formData.features.amenities.length > 0) {
          features.amenities = formData.features.amenities;
        }

        if (Object.keys(features).length > 0) {
          transformedData.features = features;
        }
      }

      // Type specific fields
      if (formData.type === 'land') {
        if (formData.facilities) transformedData.facilities = formData.facilities;
        // Note: acres is not stored in backend, only used for price calculation
      }

      if (formData.type === 'house') {
        if (formData.features.rooms && formData.features.rooms.length > 0) transformedData.features = { ...(transformedData.features || {}), rooms: formData.features.rooms };
        if (formData.features.specialRooms && formData.features.specialRooms.length > 0) transformedData.features = { ...(transformedData.features || {}), specialRooms: formData.features.specialRooms };
        if (transformedData.geoTagPhoto) transformedData.geoTagPhoto = transformedData.geoTagPhoto;
        if (formData.specifications) transformedData.specifications = formData.specifications;
      }

      if (formData.type === 'rental') {
        if (formData.monthlyPayment && formData.monthlyPayment.amount) transformedData.monthlyPayment = { amount: parseFloat(formData.monthlyPayment.amount) };
        if (formData.rules && formData.rules.length > 0) transformedData.rules = formData.rules;
        if (formData.advancePayment) transformedData.advancePayment = formData.advancePayment;
        if (transformedData.agreement) transformedData.agreement = transformedData.agreement;
      }

      let response;
      if (isEdit) {
        response = await propertyApi.updateProperty(id, transformedData);
      } else {
        response = await propertyApi.createProperty(transformedData);
      }

      if (response.success) {
        alert(`✅ Property Uploaded Successfully!\n\nProperty: ${transformedData.title}\n\nYour property has been submitted for admin verification. You will be notified once it's approved and goes live.`);
        if (typeof onSuccess === 'function') {
          try { await onSuccess(); } catch (e) { /* ignore */ }
        } else {
          navigate('/dashboard/agent');
        }
      }
    } catch (error) {
      console.error('Error saving property:', error);

      // Handle validation errors specifically
      if (error.status === 400 && error.errors) {
        // Display specific validation errors
        const errorMessages = error.errors.map(err =>
          `${err.path || err.param}: ${err.msg}`
        ).join('\n');
        alert(`Validation failed:\n\n${errorMessages}`);
      } else if (error.message && error.message.includes('Validation failed')) {
        alert(error.message);
      } else {
        alert(error.message || 'Failed to save property. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isAuthenticated() || user.role !== 'agent') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Land-specific fields */}
          {formData.type === 'land' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Land Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per Acre</label>
                  <input type="number" name="pricePerAcre" value={formData.pricePerAcre} onChange={(e) => setFormData(prev => ({ ...prev, pricePerAcre: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Utilities</label>
                  <div className="space-y-2">
                    <label><input type="checkbox" checked={formData.facilities.waterNearby} onChange={(e) => setFormData(prev => ({ ...prev, facilities: { ...prev.facilities, waterNearby: e.target.checked } }))} /> Water Nearby</label>
                    <label><input type="checkbox" checked={formData.facilities.electricity} onChange={(e) => setFormData(prev => ({ ...prev, facilities: { ...prev.facilities, electricity: e.target.checked } }))} /> Electricity</label>
                    <label><input type="checkbox" checked={formData.facilities.nearbyBuildings} onChange={(e) => setFormData(prev => ({ ...prev, facilities: { ...prev.facilities, nearbyBuildings: e.target.checked } }))} /> Nearby Buildings</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* House-specific fields */}
          {formData.type === 'house' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">House Details</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Rooms</label>
                <input type="text" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} placeholder="Add special room (e.g., Study)" className="w-full px-3 py-2 border rounded-lg" />
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { if (newAmenity.trim()) { setFormData(prev => ({ ...prev, features: { ...prev.features, specialRooms: [...prev.features.specialRooms, newAmenity.trim()] } })); setNewAmenity(''); } }} className="px-3 py-1 bg-primary-600 text-white rounded">Add</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.features.specialRooms.map((r, i) => (<span key={i} className="px-2 py-1 bg-blue-100 rounded">{r}<button type="button" onClick={() => setFormData(prev => ({ ...prev, features: { ...prev.features, specialRooms: prev.features.specialRooms.filter(x => x !== r) } }))} className="ml-1">x</button></span>))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">GeoTag Photo (for approval)</label>
                <input type="file" accept="image/*" onChange={handleGeoTagSelect} />
                {formData.geoTagPhoto && <img src={formData.geoTagPhoto.preview} className="h-24 mt-2" alt="geotag" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gate Direction</label>
                <select value={formData.specifications?.gateDirection || ''} onChange={(e) => setFormData(prev => ({ ...prev, specifications: { ...prev.specifications, gateDirection: e.target.value } }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select</option>
                  <option value="east">East</option>
                  <option value="west">West</option>
                  <option value="north">North</option>
                  <option value="south">South</option>
                </select>
              </div>
            </div>
          )}

          {/* Rental-specific fields */}
          {formData.type === 'rental' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Rental Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Payment (₹)</label>
                  <input type="number" value={formData.monthlyPayment.amount} onChange={(e) => setFormData(prev => ({ ...prev, monthlyPayment: { ...prev.monthlyPayment, amount: e.target.value } }))} className="w-full px-3 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Copy</label>
                  <input type="file" accept="application/pdf" onChange={handleAgreementSelect} />
                  {formData.agreementFile && <p className="mt-2 text-sm">{formData.agreementFile.name}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rules</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Add rule" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
                  <button type="button" onClick={() => { if (newAmenity.trim()) { setFormData(prev => ({ ...prev, rules: [...prev.rules, newAmenity.trim()] })); setNewAmenity(''); } }} className="px-3 py-1 bg-primary-600 text-white rounded">Add</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">{formData.rules.map((r, i) => (<span key={i} className="px-2 py-1 bg-blue-100 rounded">{r}<button type="button" onClick={() => setFormData(prev => ({ ...prev, rules: prev.rules.filter(x => x !== r) }))} className="ml-1">x</button></span>))}</div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Advance Payment</label>
                <input type="number" value={formData.advancePayment.amount} onChange={(e) => setFormData(prev => ({ ...prev, advancePayment: { ...prev.advancePayment, amount: e.target.value } }))} className="px-3 py-2 border rounded w-full" placeholder="Amount" />
                <label className="mt-2"><input type="checkbox" checked={formData.advancePayment.refundable} onChange={(e) => setFormData(prev => ({ ...prev, advancePayment: { ...prev.advancePayment, refundable: e.target.checked } }))} /> Refundable</label>
                <textarea value={formData.advancePayment.returnRules} onChange={(e) => setFormData(prev => ({ ...prev, advancePayment: { ...prev.advancePayment, returnRules: e.target.value } }))} className="w-full mt-2 p-2 border rounded" placeholder="Return rules" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-professional-diagonal pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/agent')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Property' : 'Add New Property'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update your property details' : 'Fill in the details to list your property'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="land">Land</option>
                  <option value="house">House</option>
                  <option value="rental">Rental</option>
                </select>
              </div>

              {formData.type === 'land' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Survey Number *
                  </label>
                  <input
                    type="text"
                    name="surveyNumber"
                    value={formData.surveyNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.surveyNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="SF-123/4A"
                  />
                  {errors.surveyNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.surveyNumber}</p>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="e.g., Modern 3BHK Villa in Chennai"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Describe your property in detail..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area (Square Feet) *
                </label>
                <input
                  type="number"
                  name="squareFeet"
                  value={formData.squareFeet}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.squareFeet ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="1200"
                />
                {errors.squareFeet && (
                  <p className="mt-1 text-sm text-red-600">{errors.squareFeet}</p>
                )}
              </div>

              {formData.type === 'rental' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    name="monthlyPayment.amount"
                    value={formData.monthlyPayment.amount}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors['monthlyPayment.amount'] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="15000"
                  />
                  {errors['monthlyPayment.amount'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['monthlyPayment.amount']}</p>
                  )}
                </div>
              )}

              {formData.type !== 'rental' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="2500000"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District *
                </label>
                <input
                  type="text"
                  name="location.district"
                  value={formData.location.district}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors['location.district'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Chennai"
                />
                {errors['location.district'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['location.district']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taluk *
                </label>
                <input
                  type="text"
                  name="location.taluk"
                  value={formData.location.taluk}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors['location.taluk'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Tambaram"
                />
                {errors['location.taluk'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['location.taluk']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area *
                </label>
                <input
                  type="text"
                  name="location.area"
                  value={formData.location.area}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors['location.area'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Sholinganallur"
                />
                {errors['location.area'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['location.area']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="location.pincode"
                  value={formData.location.pincode}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors['location.pincode'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="600119"
                />
                {errors['location.pincode'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['location.pincode']}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address *
                </label>
                <textarea
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors['location.address'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Plot No. 123, ABC Street, Area Name"
                />
                {errors['location.address'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['location.address']}</p>
                )}
              </div>
            </div>
          </div>

          {/* Owner Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Owner Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name *
                </label>
                <input
                  type="text"
                  name="ownerDetails.name"
                  value={formData.ownerDetails.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors['ownerDetails.name'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="John Doe"
                />
                {errors['ownerDetails.name'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['ownerDetails.name']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Phone *
                </label>
                <input
                  type="tel"
                  name="ownerDetails.phone"
                  value={formData.ownerDetails.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors['ownerDetails.phone'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="+919876543210"
                />
                {errors['ownerDetails.phone'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['ownerDetails.phone']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Email
                </label>
                <input
                  type="email"
                  name="ownerDetails.email"
                  value={formData.ownerDetails.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="john.doe@email.com"
                />
              </div>
            </div>
          </div>

          {/* Property Features (for house/rental) */}
          {(formData.type === 'house' || formData.type === 'rental') && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Features</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    name="features.bedrooms"
                    value={formData.features.bedrooms}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="3"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    name="features.bathrooms"
                    value={formData.features.bathrooms}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="2"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Furnished Status
                  </label>
                  <select
                    name="features.furnished"
                    value={formData.features.furnished}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Status</option>
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi-furnished">Semi Furnished</option>
                    <option value="fully-furnished">Fully Furnished</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="features.parking"
                    checked={formData.features.parking}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Parking Available</span>
                </label>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Add amenity (e.g., Swimming Pool)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAmenityAdd())}
                  />
                  <button
                    type="button"
                    onClick={handleAmenityAdd}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => handleAmenityRemove(amenity)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Land-specific fields */}
          {formData.type === 'land' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Land Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Acres</label>
                  <input
                    type="number"
                    name="acres"
                    value={formData.acres}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="5"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per Acre (₹)</label>
                  <input
                    type="number"
                    name="pricePerAcre"
                    value={formData.pricePerAcre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="50000"
                    min="0"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Price (Calculated)</label>
                  <div className="p-3 bg-gray-50 border rounded-lg">
                    <span className="text-lg font-semibold text-primary-600">₹ {formatPrice(calculatedPrice)}</span>
                    {calculatedPrice === 0 && (
                      <p className="text-sm text-gray-500 mt-1">Enter acres and price per acre to calculate total price</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Utilities</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="facilities.waterNearby"
                        checked={formData.facilities.waterNearby}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Water Nearby</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="facilities.electricity"
                        checked={formData.facilities.electricity}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Electricity</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="facilities.nearbyBuildings"
                        checked={formData.facilities.nearbyBuildings}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Nearby Buildings</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* House-specific fields */}
          {formData.type === 'house' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">House Details</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Rooms</label>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Add special room (e.g., Study)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAmenityAdd())}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAmenity.trim()) {
                        setFormData(prev => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            specialRooms: [...prev.features.specialRooms, newAmenity.trim()]
                          }
                        }));
                        setNewAmenity('');
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.specialRooms.map((room, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {room}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            specialRooms: prev.features.specialRooms.filter(r => r !== room)
                          }
                        }))}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">GeoTag Photo (for approval)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGeoTagSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {formData.geoTagPhoto && (
                  <img
                    src={formData.geoTagPhoto.preview || formData.geoTagPhoto.url}
                    className="h-24 mt-2 rounded-lg border border-gray-300"
                    alt="geotag"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gate Direction</label>
                <select
                  name="specifications.gateDirection"
                  value={formData.specifications?.gateDirection || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select</option>
                  <option value="east">East</option>
                  <option value="west">West</option>
                  <option value="north">North</option>
                  <option value="south">South</option>
                </select>
              </div>
            </div>
          )}

          {/* Rental-specific fields */}
          {formData.type === 'rental' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Rental Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Copy</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleAgreementSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {formData.agreementFile && (
                  <p className="mt-2 text-sm text-gray-600">{formData.agreementFile.name}</p>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rules</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Add rule"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAmenityAdd())}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAmenity.trim()) {
                        setFormData(prev => ({
                          ...prev,
                          rules: [...prev.rules, newAmenity.trim()]
                        }));
                        setNewAmenity('');
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.rules.map((rule, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {rule}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          rules: prev.rules.filter(r => r !== rule)
                        }))}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Advance Payment</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    name="advancePayment.amount"
                    value={formData.advancePayment.amount}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Amount"
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="advancePayment.refundable"
                      checked={formData.advancePayment.refundable}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Refundable</span>
                  </div>
                </div>
                <textarea
                  name="advancePayment.returnRules"
                  value={formData.advancePayment.returnRules}
                  onChange={handleInputChange}
                  className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Return rules"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Images */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Images</h2>

            <div className="space-y-4">


              <button
                type="button"
                onClick={handleImageAdd}
                className="flex items-center px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add / Upload Image
              </button>
              {/* Hidden file input for uploading images */}
              <input
                id="property-image-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => {
                    const src = typeof image === 'string' ? image : (image.url || image.preview || '');
                    return (
                      <div key={index} className="relative">
                        <img
                          src={src}
                          alt={`Property ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Display image validation errors */}
              {errors.images && (
                <p className="mt-1 text-sm text-red-600">{errors.images}</p>
              )}
              {Object.keys(errors).filter(key => key.startsWith('images.')).map(key => (
                <p key={key} className="text-sm text-red-600 mt-2">
                  {errors[key]}
                </p>
              ))}
            </div>
          </div>

          {/* Video */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Video</h2>

            <div className="space-y-4">
              {!formData.video ? (
                <>
                  <button
                    type="button"
                    onClick={() => document.getElementById('property-video-input')?.click()}
                    className="flex items-center px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add / Upload Video
                  </button>
                  <input
                    id="property-video-input"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500">Maximum file size: 50MB. Supported formats: MP4, AVI, MOV, etc.</p>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      src={formData.video.url}
                      controls
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleVideoRemove}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">{formData.video.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/agent')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading
                ? (isEdit ? 'Updating...' : 'Adding...')
                : (isEdit ? 'Update Property' : 'Add Property')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;