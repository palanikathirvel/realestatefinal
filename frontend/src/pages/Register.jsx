import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {GoogleLogin} from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { 
  Building2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin,
  AlertCircle,
  CheckCircle,
  UserCheck,
  Shield,
  Timer,
  RefreshCw
} from 'lucide-react';
import { authApi } from '../lib/api';

const Register = () => {
  const [step, setStep] = useState('form'); // 'form' | 'otp-sent' | 'otp-verify'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'user',
    address: {
      street: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: ''
    }
  });
  const [otpData, setOtpData] = useState({
    otp: '',
    email: '',
    expiryTime: null
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Timer for OTP expiry
  React.useEffect(() => {
    if (timeLeft > 0 && step === 'otp-verify') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, step]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log("Google credential response:", credentialResponse);

      if (!credentialResponse || !credentialResponse.credential) {
        throw new Error("No credential received from Google");
      }

      const decoded = jwtDecode(credentialResponse.credential);
      const email = decoded.email;
      const name = decoded.name;
      const userpassword = "GOOGLE_AUTH";

      console.log("Google user:", decoded);

      // Update form data with Google user information
      setFormData(prev => ({
        ...prev,
        email: email,
        name: name,
        password: userpassword,
        confirmPassword: userpassword
      }));

      // Show success message
      alert("Google sign-in successful! Please complete the registration.");

    } catch (err) {
      console.error("Google signup error:", err);
      alert("Google sign-in failed. Please try again. Error: " + err.message);
    }
  };

  const handleGoogleFailure = (error) => {
    console.error("Google login error:", error);
    alert("Google login failed: " + (error?.error || "Unknown error"));
  };


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, lowercase letter, and number';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Pincode validation (optional but if provided should be valid)
    if (formData.address.pincode && !/^\d{6}$/.test(formData.address.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Step 1: Send OTP to email
      const otpRequestData = {
        name: formData.name,
        email: formData.email,
        phone: `+91${formData.phone}`,
        role: formData.role
      };

      const response = await authApi.sendEmailOTP(otpRequestData);
      
      if (response.data.success) {
        setOtpData({
          otp: '',
          email: response.data.data.email,
          expiryTime: new Date(response.data.data.expiryTime)
        });
        
        // Calculate time left in seconds
        const expiry = new Date(response.data.data.expiryTime);
        const now = new Date();
        const timeLeftSeconds = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(timeLeftSeconds);
        
        setStep('otp-verify');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to send OTP. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (!otpData.otp || otpData.otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Step 2: Verify OTP and complete registration
      const registrationData = {
        email: otpData.email,
        otp: otpData.otp,
        password: formData.password,
        address: formData.address.street || formData.address.city || formData.address.pincode 
          ? formData.address 
          : undefined
      };

      const response = await authApi.verifyEmailAndRegister(registrationData);
      
      if (response.data.success) {
        // Auto-login after successful registration
        const { user, token } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Navigate to appropriate dashboard based on role
        if (user.role === 'admin') {
          navigate('/dashboard/admin');
        } else if (user.role === 'agent') {
          navigate('/dashboard/agent');
        } else {
          navigate('/dashboard/user');
        }
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setErrors({
        otp: error.response?.data?.message || 'Invalid OTP. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendLoading || timeLeft > 0) return;

    setResendLoading(true);
    setErrors({});

    try {
      const response = await authApi.resendEmailOTP({ email: otpData.email });
      
      if (response.data.success) {
        // Reset timer
        const expiry = new Date(response.data.data.expiryTime);
        const now = new Date();
        const timeLeftSeconds = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(timeLeftSeconds);
        
        setErrors({
          success: 'New OTP has been sent to your email!'
        });
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setErrors({
        otp: error.response?.data?.message || 'Failed to resend OTP. Please try again.'
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep('form');
    setOtpData({ otp: '', email: '', expiryTime: null });
    setTimeLeft(0);
    setErrors({});
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="min-h-screen bg-modern-fade py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-primary-600" />
          </div>
          {step === 'form' && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Create your account
              </h2>
              <p className="text-gray-600">
                Join our platform to buy, sell, or rent properties
              </p>
            </>
          )}
          {step === 'otp-verify' && (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Verify your email
              </h2>
              <p className="text-gray-600">
                We've sent a verification code to <span className="font-medium">{otpData.email}</span>
              </p>
            </>
          )}
        </div>

        {/* Registration Form */}
        {step === 'form' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">{errors.submit}</span>
                  </div>
                </div>
              )}

              {/* Google Sign In */}
              <div className="text-center">
                <div className="w-full max-w-md mx-auto">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleFailure}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="100%"
                    useOneTap={false}
                    type="standard"
                    auto_select={false}
                  />
                </div>
                <div className="mt-4 mb-6">
                  <p className="text-gray-600 font-bold">or</p>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  I want to register as:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={formData.role === 'user'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
                      formData.role === 'user' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <User className={`h-5 w-5 ${formData.role === 'user' ? 'text-primary-600' : 'text-gray-400'}`} />
                        <div>
                          <div className="font-medium text-gray-900">User</div>
                          <div className="text-sm text-gray-600">Browse and buy/rent properties</div>
                        </div>
                        {formData.role === 'user' && (
                          <CheckCircle className="h-5 w-5 text-primary-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="role"
                      value="agent"
                      checked={formData.role === 'agent'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
                      formData.role === 'agent' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <UserCheck className={`h-5 w-5 ${formData.role === 'agent' ? 'text-primary-600' : 'text-gray-400'}`} />
                        <div>
                          <div className="font-medium text-gray-900">Agent</div>
                          <div className="text-sm text-gray-600">List and manage properties</div>
                        </div>
                        {formData.role === 'agent' && (
                          <CheckCircle className="h-5 w-5 text-primary-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full pl-10 pr-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Phone Input */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="absolute inset-y-0 left-10 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">+91</span>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full pl-20 pr-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="9876543210"
                      maxLength="10"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full pl-10 pr-10 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('password')}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full pl-10 pr-10 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Address Information (Optional) */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                  Address Information (Optional)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      id="address.street"
                      name="address.street"
                      type="text"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Enter street address"
                    />
                  </div>

                  <div>
                    <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      id="address.city"
                      name="address.city"
                      type="text"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      id="address.state"
                      name="address.state"
                      type="text"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Tamil Nadu"
                    />
                  </div>

                  <div>
                    <label htmlFor="address.pincode" className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      id="address.pincode"
                      name="address.pincode"
                      type="text"
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm ${
                        errors.pincode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter pincode"
                      maxLength="6"
                    />
                    {errors.pincode && (
                      <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending OTP...
                    </div>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </div>

              {/* Terms and Privacy */}
              <div className="text-center text-sm text-gray-600">
                By creating an account, you agree to our{' '}
                <Link to="#" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="#" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* OTP Verification Form */}
        {step === 'otp-verify' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              {/* Success Message */}
              {errors.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-700">{errors.success}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errors.otp && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">{errors.otp}</span>
                  </div>
                </div>
              )}

              {/* Email verification info */}
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
                  <Shield className="h-8 w-8 text-primary-600" />
                </div>
                <p className="text-gray-600 mb-2">
                  Enter the 6-digit verification code sent to:
                </p>
                <p className="font-medium text-gray-900">{otpData.email}</p>
              </div>

              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otpData.otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpData(prev => ({ ...prev, otp: value }));
                    if (errors.otp) setErrors(prev => ({ ...prev, otp: null }));
                  }}
                  className={`appearance-none relative block w-full px-3 py-4 text-center text-2xl tracking-widest border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 ${
                    errors.otp ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="000000"
                  maxLength="6"
                />
              </div>

              {/* Timer and Resend */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <Timer className="h-4 w-4 mr-1" />
                    Code expires in {formatTime(timeLeft)}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">Didn't receive the code?</p>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendLoading}
                      className="text-primary-600 hover:text-primary-500 font-medium flex items-center justify-center mx-auto disabled:opacity-50"
                    >
                      {resendLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Resend Code
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading || otpData.otp.length !== 6}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>

              {/* Back to form */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToForm}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  ← Back to registration form
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sign In Link */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;