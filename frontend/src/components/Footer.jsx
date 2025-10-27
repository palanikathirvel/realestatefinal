import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                RealEstate
              </span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Your trusted platform for buying, selling, and renting properties in Tamil Nadu. 
              We ensure all properties are manually verified through government records for your safety.
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:realestateconnect07@gmail.com"
                className="flex items-center text-gray-600 hover:text-primary-600 transition-colors duration-200"
              >
                <Mail className="h-4 w-4 mr-2" />
                realestateconnect07@gmail.com
              </a>
            </div>
            <div className="flex space-x-4 mt-2">
              <a
                href="tel:+919876543210"
                className="flex items-center text-gray-600 hover:text-primary-600 transition-colors duration-200"
              >
                <Phone className="h-4 w-4 mr-2" />
                +91 9342558931
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/land"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Land Properties
                </Link>
              </li>
              <li>
                <Link
                  to="/rental"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Rental Properties
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Become an Agent
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
            <ul className="space-y-2">
              <li className="text-gray-600">Property Verification</li>
              <li className="text-gray-600">Government Records Check</li>
              <li className="text-gray-600">Agent Support</li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © {currentYear} RealEstate Management System. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <a
              href="#"
              className="hover:text-primary-600 transition-colors duration-200"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-primary-600 transition-colors duration-200"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="hover:text-primary-600 transition-colors duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>

        {/* Government Verification Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Government Verified Properties
              </h4>
              <p className="text-sm text-blue-700">
                All properties listed on our platform are manually verified through the 
                Tamil Nadu Government Land Portal to ensure authenticity and legal compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;