
# Real Estate Property Management System

A full-stack web application for managing real estate properties with comprehensive features for agents, users, and administrators.

## 🚀 Features

### Core Functionality
- **Multi-role Authentication**: Separate dashboards for Agents, Users, and Admins
- **Property Management**: Create, edit, and manage different property types (Land, House, Rental)
- **Advanced Property Types**:
  - Land properties with acreage calculation and utilities tracking
  - House properties with detailed specifications and geo-tagging
  - Rental properties with agreement management and rules
- **Media Upload System**: Support for multiple images and video uploads
- **Property Search & Filtering**: Advanced search capabilities
- **Admin Approval System**: Properties require admin verification before going live

### Technical Features
- **File Upload Handling**: Secure file uploads with validation and storage
- **Video Support**: Full video upload, processing, and display functionality
- **Image Gallery**: Multi-image support with primary image designation
- **Responsive Design**: Mobile-friendly interface
- **Real-time Validation**: Client-side and server-side form validation
- **Error Handling**: Comprehensive error management and user feedback

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT Authentication** for secure user sessions
- **Multer** for file upload handling
- **bcrypt** for password hashing
- **CORS** for cross-origin requests

### Frontend
- **React.js** with modern hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication

### Development Tools
- **Nodemon** for backend development
- **Concurrently** for running multiple processes
- **ESLint** for code quality

## 📁 Project Structure

```
Real_final/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── propertyController.js
│   │   └── uploadController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── House.js
│   │   ├── Land.js
│   │   └── Rental.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── propertyRoutes.js
│   │   └── uploadRoutes.js
│   ├── uploads/          # File storage directory
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PropertyCard.jsx
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── pages/
│   │   │   ├── PropertyForm.jsx
│   │   │   ├── PropertyDetails.jsx
│   │   │   ├── DashboardAgent.jsx
│   │   │   └── ...
│   │   ├── utils/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── package.json
├── TODO.md
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Backend Setup
```bash
cd backend
npm install
# Create .env file with required environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Environment Variables
Create a `.env` file in the backend directory with:
```
MONGODB_URI=mongodb://localhost:27017/realestate
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

## 📋 Development History

### Phase 1: Core Infrastructure
- ✅ Set up Express.js backend with MongoDB
- ✅ Implemented user authentication and role-based access
- ✅ Created basic property models (House, Land, Rental)
- ✅ Built responsive React frontend with routing

### Phase 2: Property Management Features
- ✅ Advanced property form with type-specific fields
- ✅ Image upload and gallery functionality
- ✅ Property validation and error handling
- ✅ Admin approval workflow

### Phase 3: Video Upload Implementation
- ✅ Added video field to all property models
- ✅ Implemented video upload in PropertyForm component
- ✅ Added video validation (file size, type checking)
- ✅ Updated property submission to handle video uploads
- ✅ Video preview and management in form interface

### Phase 4: Enhanced User Experience
- ✅ Improved form validation with real-time feedback
- ✅ Enhanced file upload with progress indicators
- ✅ Responsive design optimizations
- ✅ Error handling and user notifications

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `POST /api/properties` - Create new property
- `GET /api/properties/:id` - Get property by ID
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### File Upload
- `POST /api/upload` - Upload files (images/videos)

## 🎯 Key Features Implemented

### Video Upload System
- **File Validation**: Size limit (50MB), type checking (MP4, AVI, MOV)
- **Upload Processing**: Secure file handling with error recovery
- **Preview Functionality**: Video preview before submission
- **Storage Integration**: Base64 encoding and URL generation

### Property Form Enhancements
- **Dynamic Fields**: Type-specific form sections
- **Real-time Calculation**: Automatic price calculation for land properties
- **Media Management**: Drag-and-drop image upload, video handling
- **Validation**: Comprehensive client-side validation

### Backend Architecture
- **Modular Controllers**: Separated concerns for auth, properties, uploads
- **Middleware Chain**: Authentication, role checking, error handling
- **Database Models**: Flexible schemas for different property types
- **File Storage**: Organized upload directory with metadata

## 🚀 Future Enhancements

### Planned Features
- [ ] Video display in property details gallery
- [ ] Video thumbnail generation
- [ ] Advanced search with video filtering
- [ ] Property comparison functionality
- [ ] Real-time notifications
- [ ] Property analytics dashboard

### Technical Improvements
- [ ] Image optimization and compression
- [ ] Video streaming capabilities
- [ ] Cloud storage integration (AWS S3, Cloudinary)
- [ ] API rate limiting
- [ ] Comprehensive testing suite

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ using React, Node.js, and MongoDB**
