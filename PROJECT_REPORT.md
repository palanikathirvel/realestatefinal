# REAL ESTATE MANAGEMENT SYSTEM
## PROJECT REPORT

## CHAPTER 1
### INTRODUCTION

The Real Estate Management System is a comprehensive web-based application that digitizes traditional real estate operations through modern technology. The system serves three user roles (Admin, Agent, User) with role-specific functionalities and secure access control.

The application addresses key industry challenges including manual property verification, lack of transparency, inefficient communication, and time-consuming processes. It implements a dual-verification approach combining automated survey number validation with manual admin oversight for enhanced accuracy and efficiency.

Built using React.js frontend, Node.js/Express.js backend, and MongoDB database, the system provides responsive design across all devices. Key features include property listing and management, advanced search and filtering, secure contact access via email OTP verification, and comprehensive Recent Activities tracking for user engagement monitoring.

The platform is designed for real estate agencies, property developers, agents, and property seekers requiring a transparent and efficient digital property management solution.

---

## CHAPTER 2
### OBJECTIVES

• Role-Based Access Control: Implement secure authentication for Admin, Agent, and User roles with appropriate access levels and data privacy protection.

• Property Management System: Digitize property listing workflows for houses, land, and rental properties with multimedia support and detailed specifications.

• Dual Verification Mechanism: Establish automated survey number validation combined with manual admin oversight for comprehensive property verification.

• Contact Access & Communication: Enable secure property owner contact access through email-based OTP verification with activity tracking.

• User Activity Tracking: Provide real-time activity monitoring and personalized dashboards with localStorage-based persistence.

• Advanced Search & Filtering: Support property discovery through location, price, type, and verification status filtering with responsive design.

• CRUD Operations: Support complete create, read, update, and delete operations with data validation and error handling.

• Password Recovery & Security: Design three-step password recovery system with email OTP verification and security confirmations.

• Dashboard & Reporting: Provide role-specific dashboards with analytics for system oversight, property performance, and user engagement.

• User Experience & Interface: Design responsive interface with modern UI components and notification systems for optimal user experience.

• Scalability & Security: Ensure system scalability and security through JWT authentication, password hashing, and comprehensive audit trails.

---

## CHAPTER 3
### DESCRIPTION

The Real Estate Management System is a full-stack web application with three-tier architecture: React.js frontend, Node.js/Express.js backend, and MongoDB database, providing scalable property management solutions.

Core Architecture:
Frontend uses React.js with hooks, Context API, React Router, and Tailwind CSS for responsive design. Backend implements RESTful APIs with Express.js middleware for authentication, authorization, and error handling.

User Role System:
- Admin: System oversight, user management, property verification control, and analytics dashboard.
- Agent: Property management for houses, land, and rentals with performance tracking and notifications.
- User: Property browsing, filtering, contact access via OTP, favorites management, and activity tracking.

Property Types:
1. Land: Survey number validation, price per acre calculations, and facility tracking.
2. House: Room-wise photography, specifications, and amenities management.
3. Rental: Payment structures, rules, agreements, and advance payment terms.

Verification System:
Dual approach combining automatic survey number validation against pre-populated databases with manual admin review for comprehensive property verification.

Security and Communication:
JWT authentication, bcrypt password hashing, role-based middleware, and email-based OTP verification. Nodemailer handles OTP delivery, password recovery, and security notifications with comprehensive activity logging.

User Activity Tracking:
Recent Activities module provides personalized timelines of property interactions using localStorage persistence. Tracks viewing, favorites, and contact access with contextual information and quick actions.

Technical Implementation:
Modern development practices with environment configuration, error boundaries, form validation, file upload handling (Multer), and API documentation. Supports image/video uploads with validation and localStorage-based activity persistence.

---

## CHAPTER 4
### CLASS DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REAL ESTATE MANAGEMENT SYSTEM                     │
│                                CLASS DIAGRAM                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                           ┌──────────────────────┐
│      User            │                           │      Survey          │
├──────────────────────┤                           ├──────────────────────┤
│ - _id: ObjectId      │                           │ - _id: ObjectId      │
│ - name: String       │                           │ - surveyNumber: String│
│ - email: String      │                           │ - district: String   │
│ - password: String   │                           │ - taluk: String      │
│ - role: String       │                           │ - valid: Boolean     │
│ - phone: String      │                           │ - area: Number       │
│ - status: String     │                           │ - landType: String   │
│ - profileImage: String│                          │ - status: String     │
│ - address: Object    │                           │ - createdAt: Date    │
│ - emailVerified: Bool│                           │ - updatedAt: Date    │
│ - favorites: [ObjectId]│                         └──────────────────────┘
│ - createdAt: Date    │                                      │
│ - updatedAt: Date    │                                      │ validates
├──────────────────────┤                                      │
│ + comparePassword()  │                                      ▼
│ + getPublicProfile() │           ┌──────────────────────┐  ┌──────────────────────┐
└──────────────────────┘           │      Property        │  │      Land            │
           │                       ├──────────────────────┤  ├──────────────────────┤
           │ 1:N                   │ - _id: ObjectId      │  │ - surveyNumber: String│
           │ uploads               │ - type: String       │  │ - pricePerAcre: Number│
           │                       │ - title: String      │  │ - facilities: Object │
           ▼                       │ - description: String│  │ - video: Object      │
┌──────────────────────┐           │ - location: Object   │  └──────────────────────┘
│      Activity        │           │ - squareFeet: Number │              ▲
├──────────────────────┤           │ - price: Number      │              │
│ - _id: ObjectId      │           │ - ownerDetails: Object│             │ inherits
│ - userId: ObjectId   │◄──────────┤ - verificationStatus:│              │
│ - action: String     │   1:N     │   String             │  ┌──────────────────────┐
│ - details: Object    │  tracks   │ - uploadedBy: ObjectId│◄─┤      Property        │
│ - timestamp: Date    │           │ - images: [Object]   │  │    (Base Class)      │
│ - ipAddress: String  │           │ - views: Number      │  ├──────────────────────┤
└──────────────────────┘           │ - contactRequests: No│  │ + incrementViews()   │
           │                       │ - createdAt: Date    │  │ + incrementContacts()│
           │ 1:N                   │ - updatedAt: Date    │  └──────────────────────┘
           │ generates             ├──────────────────────┤              │
           ▼                       │ + incrementViews()   │              │ inherits
┌──────────────────────┐           │ + incrementContacts()│              │
│    Notification      │           └──────────────────────┘              ▼
├──────────────────────┤                      │                ┌──────────────────────┐
│ - _id: ObjectId      │                      │ inherits       │      House           │
│ - userId: ObjectId   │                      │                ├──────────────────────┤
│ - message: String    │                      ▼                │ - features: Object   │
│ - type: String       │           ┌──────────────────────┐    │ - rooms: [Object]    │
│ - read: Boolean      │           │      Rental          │    │ - specialRooms: [Obj]│
│ - createdAt: Date    │           ├──────────────────────┤    │ - geoTagPhoto: Object│
└──────────────────────┘           │ - monthlyPayment: Obj│    │ - specifications: Obj│
                                   │ - rules: [String]    │    │ - video: Object      │
┌──────────────────────┐           │ - charges: [Object]  │    └──────────────────────┘
│      OTP             │           │ - rooms: [Object]    │    
├──────────────────────┤           │ - agreement: Object  │    
│ - _id: ObjectId      │           │ - advancePayment: Obj│    
│ - email: String      │           │ - video: Object      │    
│ - otp: String        │           └──────────────────────┘    
│ - purpose: String    │                                        
│ - verified: Boolean  │           ┌──────────────────────┐    
│ - expiresAt: Date    │           │   AdminSettings      │    
│ - createdAt: Date    │           ├──────────────────────┤    
└──────────────────────┘           │ - _id: ObjectId      │    
           │                       │ - autoVerification:  │    
           │ enables               │   Boolean            │    
           │ contact access        │ - notificationPrefs: │    
           ▼                       │   Object             │    
    [Contact Access Process]       │ - systemMaintenance: │    
                                   │   Boolean            │    
                                   │ - updatedBy: ObjectId│    
                                   │ - updatedAt: Date    │    
                                   └──────────────────────┘    

RELATIONSHIPS:
• User →→ Property (1:N) - One user can upload multiple properties
• User →→ Activity (1:N) - One user can have multiple activities  
• User →→ Notification (1:N) - One user can receive multiple notifications
• Property ←→ House (Inheritance) - House inherits from Property
• Property ←→ Land (Inheritance) - Land inherits from Property  
• Property ←→ Rental (Inheritance) - Rental inherits from Property
• Survey →→ Land (Validation) - Survey validates Land properties
• OTP →→ Contact Access (Security) - OTP enables secure contact access
• AdminSettings (System Configuration) - Controls verification and system settings

ARROW MEANINGS:
→ (Composition/Association) - "has" or "contains" relationship
← (Inheritance) - "is a" relationship (extends/inherits)
▼ (Flow/Process) - Process flow or data flow direction
```
                                                        └──────────────────────┘
```

---

## CHAPTER 5
### TABLE STRUCTURES

#### User Table
```sql
{
  _id: ObjectId (Primary Key),
  name: String (50 chars, Required, Indexed),
  email: String (Unique, Required, Indexed),
  password: String (Hashed, Required, Select: false),
  role: String (enum: ['user', 'agent', 'admin'], Default: 'user', Indexed),
  phone: String (Indian format validation, Required),
  status: String (enum: ['active', 'blocked'], Default: 'active', Indexed),
  profileImage: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  emailVerified: Boolean (Default: false),
  verifiedAt: Date,
  favorites: [ObjectId] (References Property),
  createdAt: Date (Default: now),
  updatedAt: Date (Default: now, Auto-update),
  lastLogin: Date
}
```

#### Property Table (Base Schema)
```sql
{
  _id: ObjectId (Primary Key),
  type: String (enum: ['land', 'house', 'rental'], Required, Indexed),
  title: String (100 chars, Required),
  description: String (1000 chars, Required),
  location: {
    district: String (Required, Indexed),
    taluk: String (Required, Indexed),
    area: String (Required),
    address: String (Required),
    pincode: String (6 digits, Required),
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  squareFeet: Number (Min: 1, Required, Indexed),
  price: Number (Min: 1, Required, Indexed),
  ownerDetails: {
    name: String (Required),
    phone: String (Indian format, Required),
    email: String (Email validation),
    alternatePhone: String (Indian format)
  },
  images: [{
    base64: String (Required),
    mimeType: String,
    caption: String,
    isPrimary: Boolean (Default: false),
    url: String
  }],
  verificationStatus: String (enum: ['pending_verification', 'verified', 'rejected'], 
                              Default: 'pending_verification', Indexed),
  verificationDetails: {
    verifiedBy: ObjectId (References User),
    verifiedAt: Date,
    verificationNotes: String,
    rejectionReason: String
  },
  uploadedBy: ObjectId (References User, Required, Indexed),
  isActive: Boolean (Default: true),
  views: Number (Default: 0),
  contactRequests: Number (Default: 0),
  createdAt: Date (Default: now, Indexed),
  updatedAt: Date (Default: now, Auto-update)
}
```

#### House Table (Extends Property)
```sql
{
  // Inherits all Property fields
  features: {
    noOfRooms: Number (Default: 0),
    rooms: [{
      name: String (Required),
      type: String (enum: ['bedroom', 'kitchen', 'bathroom', 'study', 
                          'living room', 'dining room', 'balcony', 'hall', 'other']),
      sizeSqFt: Number (Min: 1, Required),
      photos: [{
        base64: String (Required),
        mimeType: String,
        caption: String,
        url: String
      }]
    }],
    specialRooms: [{
      name: String (Required),
      sizeSqFt: Number,
      photos: [Photo Object]
    }],
    furnished: String (enum: ['unfurnished', 'semi-furnished', 'fully-furnished']),
    amenities: [String]
  },
  video: {
    base64: String,
    mimeType: String,
    caption: String,
    url: String
  },
  geoTagPhoto: {
    base64: String (Required),
    mimeType: String,
    uploadedAt: Date (Default: now),
    url: String
  },
  specifications: {
    gateDirection: String (enum: ['east', 'west', 'north', 'south'], Required),
    otherSpecs: Mixed
  }
}
```

#### Land Table (Extends Property)
```sql
{
  // Inherits all Property fields
  surveyNumber: String (Required, Indexed),
  pricePerAcre: Number (Min: 1, Required),
  facilities: {
    waterNearby: Boolean (Default: false),
    electricity: Boolean (Default: false),
    nearbyBuildings: Boolean (Default: false)
  },
  video: Video Object
}
```

#### Rental Table (Extends Property)
```sql
{
  // Inherits all Property fields
  monthlyPayment: {
    amount: Number (Min: 1, Required),
    currency: String (Default: 'INR')
  },
  rules: [String] (Required),
  charges: [{
    name: String (Required),
    amount: Number (Min: 0, Required)
  }],
  rooms: [{
    name: String (Required),
    type: String (enum: ['bachelor', 'family'], Required),
    photos: [Photo Object]
  }],
  agreement: {
    base64: String (Required),
    mimeType: String,
    uploadedAt: Date (Default: now),
    url: String
  },
  advancePayment: {
    amount: Number (Min: 0, Required),
    refundable: Boolean (Default: false),
    returnRules: String (Required)
  },
  video: Video Object
}
```

#### Survey Table
```sql
{
  _id: ObjectId (Primary Key),
  surveyNumber: String (Unique, Required, Indexed),
  district: String (Required, Indexed),
  taluk: String (Required, Indexed),
  valid: Boolean (Default: true, Indexed),
  area: Number,
  landType: String (enum: ['agricultural', 'residential', 'commercial', 
                          'industrial', 'vacant'], Default: 'residential'),
  ownerDetails: {
    name: String,
    documentNumber: String
  },
  registrationDate: Date (Default: now),
  lastVerified: Date (Default: now),
  status: String (enum: ['active', 'disputed', 'transferred', 'cancelled'], 
                 Default: 'active'),
  createdAt: Date (Default: now),
  updatedAt: Date (Auto-update)
}
```

#### OTP Table
```sql
{
  _id: ObjectId (Primary Key),
  email: String (Required, Indexed),
  otp: String (Required),
  purpose: String (enum: ['email_verification', 'contact_access', 'password_reset']),
  verified: Boolean (Default: false),
  expiresAt: Date (TTL Index),
  createdAt: Date (Default: now),
  ipAddress: String,
  attempts: Number (Default: 0),
  userId: ObjectId (References User, for password reset)
}
```

#### Activity Table
```sql
{
  _id: ObjectId (Primary Key),
  userId: ObjectId (References User, Required, Indexed),
  action: String (Required),
  details: {
    propertyId: ObjectId,
    propertyType: String,
    verificationStatus: String,
    contactAccessed: Boolean,
    targetUserId: ObjectId
  },
  timestamp: Date (Default: now, Indexed),
  ipAddress: String,
  userAgent: String
}
```

#### Notification Table
```sql
{
  _id: ObjectId (Primary Key),
  userId: ObjectId (References User, Required, Indexed),
  message: String (Required),
  type: String (enum: ['contact_access', 'property_verification', 'system_update']),
  read: Boolean (Default: false, Indexed),
  relatedEntity: {
    type: String,
    id: ObjectId
  },
  createdAt: Date (Default: now, Indexed)
}
```

#### AdminSettings Table
```sql
{
  _id: ObjectId (Primary Key),
  autoVerification: Boolean (Default: false),
  notificationPreferences: {
    emailNotifications: Boolean (Default: true),
    systemAlerts: Boolean (Default: true),
    propertyUpdates: Boolean (Default: true)
  },
  systemMaintenance: Boolean (Default: false),
  maintenanceMessage: String,
  updatedBy: ObjectId (References User),
  updatedAt: Date (Auto-update)
}
```

---

## CHAPTER 6
### ER DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REAL ESTATE MANAGEMENT SYSTEM                            │
│                           ER DIAGRAM                                        │
└─────────────────────────────────────────────────────────────────────────────┘

          ┌─────────────┐
          │    USER     │
          │             │
          │ _id (PK)    │◄─────────────────┐
          │ name        │                  │
          │ email       │                  │ 1:N
          │ password    │                  │
          │ role        │                  │
          │ phone       │        ┌─────────▼──────┐
          │ status      │        │   PROPERTY     │
          │ address     │        │                │
          │ favorites   │        │ _id (PK)       │
          └─────────────┘        │ type           │
                 │               │ title          │
                 │ 1:N           │ description    │
                 │               │ location       │
                 ▼               │ squareFeet     │
          ┌─────────────┐        │ price          │
          │  ACTIVITY   │        │ ownerDetails   │
          │             │        │ verification   │
          │ _id (PK)    │        │ uploadedBy(FK) │
          │ userId (FK) │        │ images         │
          │ action      │        │ views          │
          │ details     │        │ contactReqs    │
          │ timestamp   │        └────────────────┘
          │ ipAddress   │                 │
          └─────────────┘                 │ INHERITANCE
                 │                        │
                 │ 1:N                    ▼
                 ▼               ┌────────────────┐
          ┌─────────────┐        │ ┌────────────┐ │
          │NOTIFICATION │        │ │   HOUSE    │ │
          │             │        │ │            │ │
          │ _id (PK)    │        │ │ features   │ │
          │ userId (FK) │        │ │ rooms      │ │
          │ message     │        │ │ geoTagPhoto│ │
          │ type        │        │ │ video      │ │
          │ read        │        │ │ specs      │ │
          │ createdAt   │        │ └────────────┘ │
          └─────────────┘        ├────────────────┤
                                 │ ┌────────────┐ │
          ┌─────────────┐        │ │    LAND    │ │
          │    OTP      │        │ │            │ │
          │             │        │ │ surveyNum  │ │
          │ _id (PK)    │        │ │ pricePerAcre│ │
          │ email       │        │ │ facilities │ │
          │ otp         │        │ │ video      │ │
          │ purpose     │        │ └────────────┘ │
          │ verified    │        ├────────────────┤
          │ expiresAt   │        │ ┌────────────┐ │
          │ createdAt   │        │ │   RENTAL   │ │
          └─────────────┘        │ │            │ │
                                 │ │ monthlyPay │ │
          ┌─────────────┐        │ │ rules      │ │
          │   SURVEY    │        │ │ charges    │ │
          │             │        │ │ agreement  │ │
          │ _id (PK)    │        │ │ advancePay │ │
          │ surveyNum   │        │ │ video      │ │
          │ district    │        │ └────────────┘ │
          │ taluk       │        └────────────────┘
          │ valid       │
          │ area        │        ┌─────────────┐
          │ landType    │        │ADMIN_SETTINGS│
          │ status      │        │             │
          │ ownerDetails│        │ _id (PK)    │
          └─────────────┘        │ autoVerify  │
                                 │ notifications│
                                 │ maintenance │
                                 │ updatedBy   │
                                 └─────────────┘

RELATIONSHIPS:
• User →→ Property (1:N) - Users can upload multiple properties
• User →→ Activity (1:N) - Users can have multiple activities  
• User →→ Notification (1:N) - Users can receive multiple notifications
• Property inherits to House, Land, Rental (Inheritance)
• Survey validates Land properties (Business Logic)
• OTP enables secure contact access (Business Logic)
• AdminSettings controls verification mode (System Configuration)
```

---

## CHAPTER 7
### MODULES

7. Pages

The website includes multiple pages such as Home, Properties, Property Details, User Dashboard, Agent Dashboard, Admin Dashboard, Login, Register, Profile, Property Form, and Forgot Password. Each page is designed for easy navigation, offering users a seamless and interactive experience across the platform. The Real Estate Management System provides comprehensive functionality for property browsing, user authentication, role-based dashboards, and property management operations.

7.1 Authentication Pages

The authentication system provides secure access control for different user roles including users, agents, and administrators. These pages implement comprehensive security measures including JWT token authentication, password encryption, and role-based access control to ensure platform security and user data protection.

7.1.1 Login Page

The Login Page provides a secure access point for users, agents, and administrators to enter the system using their credentials. It ensures role-based authentication, allowing authorized users to access their respective dashboards and functionalities based on their assigned roles. The page implements comprehensive form validation, error handling, and secure authentication protocols.

React Concepts Used:

useState is utilized to manage the state of input fields including email and password, loading indicators during authentication process, selected user role, and error messages for invalid credentials or server errors. useNavigate from react-router-dom handles redirection logic, directing users to their appropriate dashboards (user dashboard, agent dashboard, or admin panel) after successful authentication. Conditional Rendering displays different UI elements based on the selected role and authentication state, showing role-specific login options and status indicators. Form Handling manages login form submission, input validation, and user interaction events. The custom Context using useAuth handles user authentication state management and stores user data in context for application-wide access. React Icons library provides intuitive visual cues for email, password, and role selection inputs, enhancing user experience.

Node.js Backend Concepts Used:

RESTful API Calls using fetch send POST requests to the /api/auth/login endpoint to authenticate user credentials against the database. Role-Based Access Control differentiates between admin, agent, and user logins on the server side, ensuring appropriate access permissions. JWT Token Storage securely stores authentication tokens in localStorage for session management and maintains user authentication state across application sessions. Error Handling catches server errors, database connection issues, and authentication failures, displaying appropriate error messages to users for debugging and user guidance.

Screenshot Implementation:
Frontend Screenshot: Login form interface displaying email input field, password input field, role selection dropdown menu, login button, and forgot password link with responsive design
Backend Screenshot: JWT token generation process, authentication API response with user role data, and database query results for user verification

7.1.2 Register Page

The Register Page enables new users to create accounts on the platform with role selection capabilities for users and agents. It implements comprehensive registration workflow including form validation, email verification, password security requirements, and automatic login functionality upon successful account creation.

React Concepts Used:

useState manages complex form state including user input fields for name, email, password, phone number, address, role selection between user and agent, loading states during registration process, validation error messages, and success confirmation states. useNavigate handles post-registration redirection to appropriate dashboards based on user role selection. Conditional Rendering shows different form fields and validation messages based on selected role and form validation status. Form Validation implements client-side validation for email format verification, password strength requirements, phone number format checking, and required field validation. The useAuth Context manages global authentication state and handles automatic login after successful registration.

Node.js Backend Concepts Used:

RESTful API integration sends POST requests to /api/auth/register endpoint for user account creation with comprehensive data validation. Password Security implements bcrypt hashing with salt rounds for secure password storage in the database. Email Verification system sends OTP verification emails to users for account activation and security verification. Input Validation uses express-validator for server-side validation of user input data, preventing malicious data injection. Database Integration creates new user records in MongoDB with proper schema validation and error handling.

Screenshot Implementation:
Frontend Screenshot: Registration form with name, email, password, phone, address fields, role selection, and submit button
Backend Screenshot: User creation API response, password hashing process, and database record insertion confirmation

7.1.3 Forgot Password Page

The Forgot Password Page provides a comprehensive password recovery system with multi-step verification process including email validation, OTP verification, and secure password reset functionality. It ensures account security through time-limited OTP codes and comprehensive validation processes.

React Concepts Used:

useState and useEffect manage multi-step form state including email input for password reset request, OTP verification code input, new password and confirmation fields, countdown timer for OTP expiration, loading states for each step, and validation error messages. useNavigate and useLocation handle routing between password reset steps and display success messages from completed password reset process. Conditional Rendering shows different UI components for email input stage, OTP verification stage, and password reset confirmation stage. Form Validation implements real-time password strength validation, confirmation password matching, and OTP format verification. Timer Management handles OTP expiration countdown with automatic cleanup and resend functionality.

Node.js Backend Concepts Used:

RESTful API endpoints include POST /api/auth/forgot-password for email validation and OTP generation, and POST /api/auth/reset-password for OTP verification and password update functionality. Email Service Integration uses Nodemailer with professional HTML email templates for password reset instructions and security notifications. Security Features implement time-limited OTP expiration, maximum verification attempts, and comprehensive activity logging. Database Operations handle OTP storage, verification, and secure password updates with bcrypt hashing.

Screenshot Implementation:
Frontend Screenshot: Multi-step password reset form showing email input, OTP verification, and new password fields
Backend Screenshot: OTP generation process, email sending confirmation, and password update API response

7.2 Dashboard Pages

The dashboard system provides role-specific interfaces for users, agents, and administrators, each tailored to their specific needs and responsibilities. These dashboards implement real-time data updates, interactive components, and comprehensive functionality management.

7.2.1 User Dashboard

The User Dashboard provides a personalized interface for regular users to manage their property browsing experience, view recent activities, manage favorite properties, and access account settings. It serves as the central hub for user interactions with the platform.

React Concepts Used:

useState and useEffect manage dashboard data including user statistics, recent activities list, favorite properties, loading states for data fetching, and user profile information. useAuth Context accesses current user data and authentication status for personalized dashboard content. Component State handles activity display management, favorite property interactions, and dashboard refresh functionality. Conditional Rendering displays different dashboard sections based on user activity and data availability. Event Handling manages user interactions including activity clearing, property viewing, and dashboard navigation.

Node.js Backend Concepts Used:

RESTful API calls fetch user-specific data from multiple endpoints including /api/users/dashboard for user statistics, /api/properties/favorites for favorite properties, and /api/activities/recent for user activity history. Database Aggregation uses MongoDB aggregation pipelines to compile user statistics and activity summaries. Real-time Updates implement periodic data refresh for live dashboard information. Authentication Middleware ensures secure access to user-specific dashboard data.

Screenshot Implementation:
Frontend Screenshot: User dashboard showing welcome message, recent activities section, favorite properties grid, and user statistics
Backend Screenshot: Dashboard API response with user data, favorite properties query results, and activity aggregation pipeline

7.2.2 Agent Dashboard

The Agent Dashboard provides comprehensive property management tools for real estate agents including property portfolio management, performance analytics, contact request notifications, and property upload capabilities. It enables agents to efficiently manage their property listings and track their performance metrics.

React Concepts Used:

useState and useEffect manage agent-specific data including property portfolio, performance statistics, contact request notifications, loading states, and agent profile information. CRUD Operations provide complete property management interface including create, read, update, and delete functionality for property listings. Analytics Components display property performance charts, view statistics, contact request metrics, and market trend analysis. Notification System implements real-time alerts for property interactions, contact requests, and system updates. Table Management provides sortable and filterable property management tables with pagination support.

Node.js Backend Concepts Used:

RESTful API endpoints include /api/agents/dashboard for agent statistics, /api/properties/agent for agent property listings, and /api/agents/notifications for real-time notifications. Database Queries implement complex MongoDB aggregations for agent performance analytics and property statistics. Real-time Updates use WebSocket connections or polling for live notification delivery. Authorization Middleware ensures agents can only access their own property data and statistics.

Screenshot Implementation:
Frontend Screenshot: Agent dashboard with property management table, performance analytics charts, and notification panel
Backend Screenshot: Agent statistics API response, property aggregation results, and notification system data

7.2.3 Admin Dashboard

The Admin Dashboard provides comprehensive administrative oversight with system analytics, user management tools, property verification queues, and platform configuration options. It serves as the central control panel for platform administration and monitoring.

React Concepts Used:

useState and useEffect manage comprehensive dashboard data including system statistics, user analytics, property verification queues, loading states, and administrative notifications. Chart Components render complex analytics using charting libraries for visual representation of platform metrics, user engagement data, and property trends. Real-time Updates implement periodic data refresh for live system monitoring and administrative alerts. Responsive Design adapts dashboard layout for different screen sizes and administrative workflows. Modal Components handle administrative actions including user management, property verification, and system configuration.

Node.js Backend Concepts Used:

RESTful API calls access administrative endpoints including /api/admin/dashboard for system statistics, /api/admin/users for user management, and /api/admin/properties for property oversight. Database Aggregation implements complex MongoDB aggregation pipelines for comprehensive system analytics and reporting. Caching Strategy uses Redis or memory caching for frequently accessed administrative data to improve performance. Administrative Logging records all administrative actions for audit trails and system monitoring.

Screenshot Implementation:
Frontend Screenshot: Admin dashboard with system statistics cards, user analytics charts, and property verification queue
Backend Screenshot: System analytics aggregation results, administrative API responses, and database statistics

7.3 Property Management Pages

The property management system enables comprehensive property operations including listing creation, browsing, detailed viewing, and management functionalities. These pages provide the core functionality for property-related operations on the platform.

7.3.1 Property Form Page

The Property Form Page provides a comprehensive interface for adding and editing property listings with support for multiple property types including houses, land, and rental properties. It implements dynamic form fields, file upload capabilities, and extensive validation to ensure data quality and completeness.

React Concepts Used:

useState manages complex form state including property type selection, dynamic form fields based on property type, image and video upload handling, location data, pricing information, and form validation states. useParams determines whether the form operates in add or edit mode based on URL parameters and loads existing property data for editing. useAuth accesses current user information for property ownership assignment and permission validation. Conditional Rendering displays type-specific form fields such as room management for houses, survey number validation for land, and rental agreement terms for rental properties. File Upload Handling manages multiple image uploads with preview functionality, video file processing, and file validation. Form Validation implements real-time validation for required fields, format checking, and business rule validation.

Node.js Backend Concepts Used:

RESTful API endpoints include POST /api/properties for new property creation and PUT /api/properties/:id for property updates with comprehensive data validation. File Upload Processing uses Multer middleware for handling image and video uploads with size limits and type validation. Survey Validation integrates with survey database to validate land survey numbers and ensure data accuracy. Auto-verification Logic determines property verification status based on administrative settings and property type. Database Operations handle property record creation, updates, and relationship management with user accounts.

Screenshot Implementation:
Frontend Screenshot: Property form interface showing property type selection, image upload section, and dynamic form fields
Backend Screenshot: Property creation API response, file upload processing, and database record creation confirmation

7.3.2 Properties Page

The Properties Page implements an advanced property search and browsing system with comprehensive filtering options, responsive design, and efficient data loading. It serves as the main property discovery interface for users to find properties matching their criteria.

React Concepts Used:

useState and useEffect manage property search results, filter parameters, pagination state, loading indicators, and search functionality. useSearchParams implements URL-based filter persistence enabling users to share and bookmark search results. useMemo optimizes filter calculations and sort operations for improved performance with large datasets. Responsive Design provides grid and list view modes with mobile-friendly layouts and touch-optimized interfaces. Pagination handles large property datasets with page-based navigation and infinite scroll options. Search Functionality implements real-time search with debouncing and autocomplete suggestions.

Node.js Backend Concepts Used:

RESTful API integration uses GET /api/properties/search with comprehensive query parameters for advanced filtering and searching. Database Aggregation implements MongoDB aggregation pipelines for complex filtering operations including location-based searches, price range filtering, and property type categorization. Performance Optimization uses database indexing for fast search results and query optimization for large datasets. Pagination Support provides limit and skip functionality for efficient data loading and improved user experience.

Screenshot Implementation:
Frontend Screenshot: Properties page showing search filters, property grid layout, and pagination controls
Backend Screenshot: Property search API response, aggregation pipeline results, and database query performance metrics

7.3.3 Property Details Page

The Property Details Page provides comprehensive property information display with image galleries, video integration, owner contact access, and related property suggestions. It serves as the detailed view for individual property listings with interactive features and secure contact access.

React Concepts Used:

useState and useEffect manage property data loading, image gallery state, video playback controls, contact access modal state, and related properties data. useParams retrieves property ID from URL parameters for data fetching and ensures proper property identification. Modal Components handle image gallery display with zoom functionality, navigation controls, and contact information access through OTP verification. Conditional Rendering displays different layouts and information based on property type, verification status, and user permissions. Loading States implement comprehensive loading indicators and error states for all data fetching operations.

Node.js Backend Concepts Used:

RESTful API endpoints include GET /api/properties/:id for detailed property information, POST /api/properties/:id/view for tracking property views, and POST /api/properties/:id/contact-request for logging contact access attempts. Database Operations handle property view counting, contact request logging, and related property suggestions based on location and type. Notification System sends alerts to property owners about contact requests and view statistics. Analytics Integration tracks property performance metrics and user engagement data.

Screenshot Implementation:
Frontend Screenshot: Property details page with image gallery, property specifications, and contact access button
Backend Screenshot: Property details API response, view tracking confirmation, and contact request logging

7.4 User Management Pages

The user management system provides comprehensive profile management, settings configuration, and account administration functionalities. These pages enable users to maintain their accounts and customize their platform experience.

7.4.1 Profile Page

The Profile Page enables users to view and edit their personal information, manage account settings, update profile pictures, and configure notification preferences. It provides comprehensive account management functionality with secure data handling and validation.

React Concepts Used:

useState and useEffect manage user profile data, form editing states, image upload for profile pictures, loading indicators, and validation error messages. useAuth Context accesses current user data and handles profile updates with real-time state synchronization. Form Handling implements profile editing functionality with validation, change tracking, and save confirmation. File Upload manages profile picture uploads with preview functionality and image optimization. Conditional Rendering shows different interface elements based on edit mode, user role, and data availability.

Node.js Backend Concepts Used:

RESTful API operations include GET /api/users/profile for profile data retrieval and PUT /api/users/profile for profile updates with comprehensive validation. Authentication Middleware ensures users can only access and modify their own profile data. File Upload Processing handles profile picture uploads with image optimization and storage management. Database Updates implement secure profile modification with validation and error handling.

Screenshot Implementation:
Frontend Screenshot: Profile page showing user information form, profile picture upload, and account settings
Backend Screenshot: Profile update API response, image upload processing, and database record modification

7.5 Support Pages

The support system provides user assistance, error handling, and additional functionality to enhance user experience and platform reliability.

7.5.1 Not Found Page

The Not Found Page provides user-friendly error handling for invalid URLs and missing resources. It implements helpful navigation options and maintains consistent design standards while guiding users back to valid application areas.

React Concepts Used:

useNavigate provides navigation options to help users return to valid application areas including home page, login page, or previous location. Conditional Rendering displays different content and navigation options based on user authentication status and role. Error Boundary integration handles routing errors and provides graceful error recovery. Responsive Design ensures consistent appearance across all device types and screen sizes.

Screenshot Implementation:
Frontend Screenshot: 404 error page with friendly message, navigation options, and consistent branding
Backend Screenshot: Error logging for invalid route attempts and analytics data for missing resources

The comprehensive module documentation covers all major pages and functionalities of the Real Estate Management System, providing detailed technical implementation information for both frontend React components and backend Node.js operations. Each module includes specific React concepts, backend integration details, and screenshot implementation guidance for complete documentation coverage.

---

## CHAPTER 8
### MODULES

#### 8.1 Authentication Module

8.1.1 User Registration
The registration module implements comprehensive user onboarding with role-based account creation. Users can register as either 'user' or 'agent', with admin accounts created through separate processes.

*React Concepts Used:*
- `useState`: Manages form inputs, loading states, validation errors, and role selection
- `useNavigate`: Redirects users after successful registration or to login page
- `Context API (useAuth)`: Handles global authentication state and auto-login after registration
- `Form Validation`: Client-side validation for email format, password strength, phone number format
- `Conditional Rendering`: Shows loading indicators, error messages, and role-specific fields

*Backend Integration:*
- `POST /api/auth/register`: Creates new user account with password hashing and email verification
- `JWT Token Generation`: Issues authentication tokens for immediate login
- `Email Verification`: Sends OTP to user's email for account verification
- `Input Validation`: Server-side validation using express-validator
- `Password Security`: bcrypt hashing with salt rounds for secure password storage

8.1.2 User Login
Secure authentication system supporting multiple login methods with role-based redirection.

*React Concepts Used:*
- `useState & useEffect`: Manages login form state, error handling, and role selection
- `useAuth Context`: Stores user data and authentication tokens globally
- `useNavigate`: Role-based redirection (admin → admin dashboard, agent → agent dashboard, user → user dashboard)
- `Conditional Rendering`: Shows different UI elements based on authentication status
- `Error Handling`: Displays authentication errors and validation messages

*Backend Integration:*
- `POST /api/auth/login`: Authenticates user credentials and issues JWT tokens
- `Password Verification`: bcrypt comparison for secure password validation
- `Role-Based Authentication`: Returns user role for frontend routing
- `Session Management`: JWT token generation with expiration handling
- `Security Headers`: CORS and helmet middleware for secure communication

8.1.3 OAuth Integration
Google OAuth integration for streamlined user authentication.

*React Concepts Used:*
- `@react-oauth/google`: Google OAuth button component integration
- `Context API`: Handles OAuth success and error states
- `Conditional Rendering`: Shows OAuth options based on user role selection
- `Error Boundary`: Catches and handles OAuth-related errors
- `State Management`: Manages OAuth loading and success states

*Backend Integration:*
- `Google OAuth Verification`: Validates Google tokens and creates/updates user accounts
- `JWT Integration`: Issues internal JWT tokens after successful OAuth verification
- `Account Linking`: Links OAuth accounts with existing user data if available

8.1.4 Forgot Password System
Comprehensive password recovery system with OTP-based email verification for secure password reset functionality.

*React Concepts Used:*
- `useState & useEffect`: Manages multi-step form state, OTP countdown timer, and validation
- `useNavigate & useLocation`: Handles routing and displays success messages from password reset
- `Conditional Rendering`: Shows different UI for email input, OTP verification, and success confirmation
- `Form Validation`: Real-time password strength validation and confirmation matching
- `Timer Management`: OTP expiration countdown with automatic cleanup

*Security Features:*
- Three-Step Process: Email verification → OTP validation → Password reset
- Time-Limited OTP: 10-minute expiration with visible countdown
- Attempt Limiting: Maximum 3 OTP verification attempts
- Password Validation: Enforces strong password requirements
- Resend Functionality: Rate-limited OTP resend capability

*Backend Integration:*
- `POST /api/auth/forgot-password`: Validates user email and sends OTP
- `POST /api/auth/reset-password`: Verifies OTP and updates password securely
- `Email Service Integration`: Professional HTML email templates for password reset
- `Activity Logging`: Comprehensive audit trail for password reset attempts
- `Security Confirmations`: Email notifications for successful password changes

#### 7.2 Property Management Module

7.2.1 Property Form Component
Comprehensive property addition and editing interface supporting multiple property types with dynamic form fields.

*React Concepts Used:*
- `useState`: Manages complex form state including property type, images, videos, and location data
- `useParams`: Determines if form is in add or edit mode based on URL parameters
- `useAuth`: Accesses user information for property ownership assignment
- `Conditional Rendering`: Shows type-specific form fields (house rooms, land facilities, rental agreements)
- `File Upload Handling`: Manages image and video uploads with preview functionality
- `Form Validation`: Real-time validation for required fields and format checking

*Property Type Implementations:*

House Properties:
- Room management with photo uploads for each room
- Gate direction specification and amenities selection
- Geo-tagged photo requirement for location verification
- Furnished status and special rooms configuration

Land Properties:
- Survey number validation and price per acre calculation
- Facility tracking (water, electricity, nearby buildings)
- Automatic price calculation based on acreage and price per acre
- Integration with survey database for validation

Rental Properties:
- Monthly payment structure and additional charges
- Rental rules and agreement document upload
- Advance payment terms and refund policies
- Room type specification (bachelor/family)

*Backend Integration:*
- `POST/PUT /api/properties`: Creates or updates property records
- `File Upload Processing`: Handles image and video uploads with Multer
- `Survey Validation`: Validates land survey numbers against survey database
- `Auto-verification Check`: Determines verification mode based on admin settings

7.2.2 Property Search and Filtering
Advanced property search system with multiple filter options and responsive design.

*React Concepts Used:*
- `useState & useEffect`: Manages search parameters, filter states, and results
- `useSearchParams`: Handles URL-based filter persistence and sharing
- `useMemo`: Optimizes filter and sort calculations for better performance
- `Responsive Design`: Grid and list view modes with mobile-friendly layouts
- `Pagination`: Handles large result sets with page-based navigation

*Filter Capabilities:*
- Location-based filtering (district, taluk, area)
- Price range filtering with min/max inputs
- Property type filtering (house, land, rental)
- Verification status filtering
- Sort options (price, date, area, relevance)

*Backend Integration:*
- `GET /api/properties/search`: Advanced search with query parameters
- `Aggregation Pipelines`: MongoDB aggregation for complex filtering
- `Performance Optimization`: Indexed queries for fast search results
- `Pagination Support`: Limit and skip functionality for large datasets

7.2.3 Property Details Page
Comprehensive property display with image galleries, video integration, and contact access functionality.

*React Concepts Used:*
- `useState & useEffect`: Manages property data, image gallery, and video playback
- `useParams`: Retrieves property ID from URL for data fetching
- `Modal Components`: Image gallery modal and contact information modal
- `Conditional Rendering`: Shows different layouts based on property type
- `Loading States`: Handles loading indicators and error states

*Features:*
- Multi-image gallery with zoom and navigation
- Video playback with controls and fallback options
- Property specification display based on type
- Owner contact access through OTP verification
- Related properties suggestions
- Property view tracking and analytics

*Backend Integration:*
- `GET /api/properties/:id`: Fetches detailed property information
- `POST /api/properties/:id/view`: Tracks property view counts
- `POST /api/properties/:id/contact-request`: Logs contact access attempts
- `Notification System`: Notifies property owners of contact requests

#### 7.3 Admin Management Module

7.3.1 Admin Dashboard
Comprehensive administrative overview with system analytics and quick access to management functions.

*React Concepts Used:*
- `useState & useEffect`: Manages dashboard data, loading states, and refresh functionality
- `Context API`: Accesses admin authentication and permissions
- `Chart Components`: Displays analytics using chart libraries (Recharts/Chart.js)
- `Real-time Updates`: Implements periodic data refresh for live statistics
- `Responsive Design`: Adapts dashboard layout for different screen sizes

*Dashboard Metrics:*
- Total users, agents, and properties statistics
- Verification status breakdown (pending, verified, rejected)
- Recent activities and system logs
- OTP usage statistics and security metrics
- Property upload trends and user engagement

*Backend Integration:*
- `GET /api/admin/dashboard`: Retrieves comprehensive dashboard statistics
- `GET /api/admin/recent-activities`: Fetches latest system activities
- `Aggregation Queries`: Complex MongoDB aggregations for analytics
- `Caching Strategy`: Implements caching for frequently accessed dashboard data

7.3.2 Property Verification Management
Administrative interface for property approval workflow with manual and automatic verification modes.

*React Concepts Used:*
- `useState`: Manages verification queue, selected properties, and modal states
- `Conditional Rendering`: Shows different verification interfaces based on property type
- `Bulk Operations`: Handles multiple property verification selections
- `Modal Components`: Detailed property review modals with verification controls
- `Filter and Search`: Filters pending properties by type, location, and date

*Verification Features:*
- Property queue management with priority sorting
- Detailed property review with image and document verification
- Survey number validation for land properties
- Batch approval/rejection capabilities
- Verification notes and rejection reason tracking

*Backend Integration:*
- `GET /api/admin/properties/pending`: Retrieves properties awaiting verification
- `PUT /api/admin/properties/:id/verify`: Updates property verification status
- `POST /api/admin/properties/bulk-verify`: Handles batch verification operations
- `Activity Logging`: Records all verification decisions and admin actions

7.3.3 User Management System
Comprehensive user administration with role management and account controls.

*React Concepts Used:*
- `useState & useMemo`: Manages user lists, search filters, and performance optimization
- `Pagination`: Handles large user datasets with efficient loading
- `Modal Forms`: User editing and role change interfaces
- `Bulk Actions`: Multi-user selection and batch operations
- `Search and Filter`: Real-time user search with multiple filter criteria

*User Management Features:*
- User role modification (user ↔ agent promotions/demotions)
- Account status management (active/blocked)
- User activity monitoring and audit trails
- Profile information editing and verification
- Account deletion and data management

*Backend Integration:*
- `GET /api/admin/users`: Retrieves paginated user lists with filters
- `PUT /api/admin/users/:id`: Updates user information and roles
- `DELETE /api/admin/users/:id`: Handles user account deletion
- `GET /api/admin/users/:id/activities`: Retrieves user activity history

**7.3.4 System Settings and Configuration**
Administrative controls for system-wide settings and operational modes.

*React Concepts Used:*
- `useState`: Manages settings form states and configuration options
- `useEffect`: Loads current settings and handles updates
- `Form Handling`: Complex form management for multiple setting categories
- `Confirmation Modals`: Confirms critical setting changes
- `Real-time Preview`: Shows impact of setting changes before application

*Configuration Options:*
- Auto-verification mode toggle
- Email notification preferences
- System maintenance mode
- Survey database management
- Security and rate limiting settings

*Backend Integration:*
- `GET /api/admin/settings`: Retrieves current system configuration
- `PUT /api/admin/settings`: Updates system settings with validation
- `POST /api/admin/settings/survey-database`: Manages survey data imports
- `Audit Logging`: Records all configuration changes with timestamps

#### 7.4 User Interface Module

7.4.1 Property Browsing Interface
User-friendly property exploration with advanced filtering and search capabilities.

*React Concepts Used:*
- `useState & useEffect`: Manages property lists, filters, and search parameters
- `useSearchParams`: Implements URL-based filter persistence
- `Infinite Scroll`: Implements lazy loading for large property datasets
- `Responsive Grid`: Adapts property display for different screen sizes
- `Loading States`: Shows skeleton loaders during data fetching

*Features:*
- Category-based property filtering
- Location-based search functionality
- Price range sliders and advanced filters
- Property comparison functionality
- Favorite properties management

7.4.2 Contact Access System
Secure contact information access through OTP verification.

*React Concepts Used:*
- `useState`: Manages OTP form state, verification status, and timer
- `useEffect`: Handles OTP expiration countdown and auto-refresh
- `Modal Components`: OTP input modal with user-friendly interface
- `Form Validation`: Real-time OTP format validation
- `Error Handling`: Comprehensive error states and retry mechanisms

*Security Features:*
- Email-based OTP verification
- Time-limited access codes
- Rate limiting for OTP requests
- Secure contact information display
- Activity logging for contact access

*Backend Integration:*
- `POST /api/otp/send-email-contact`: Generates and sends OTP to user's email for contact access
- `POST /api/otp/verify-email-contact`: Validates OTP and grants contact access to property owner details
- `Email Service`: Nodemailer integration for professional OTP delivery with HTML templates
- `Security Logging`: Records all contact access attempts with comprehensive activity tracking
- `Activity Recording`: Automatically logs contact access events to user's recent activities timeline

7.4.3 Agent Dashboard
Agent-specific interface for property management and performance analytics.

*React Concepts Used:*
- `useState & useEffect`: Manages agent properties, statistics, and notifications
- `CRUD Operations`: Complete property management interface
- `Analytics Components`: Property performance charts and metrics
- `Notification System`: Real-time alerts for property interactions
- `Table Management`: Sortable and filterable property tables

*Agent Features:*
- Property portfolio management
- Performance analytics and insights
- Contact request notifications
- Property editing and updates
- Upload new properties interface

#### 7.5 Recent Activities Module

7.5.1 Activity Tracking System
Comprehensive user activity monitoring system that tracks and displays user interactions with properties in real-time.

*React Concepts Used:*
- `useState & useEffect`: Manages activity list state, loading states, and real-time updates
- `useContext`: Integrates with authentication context for user-specific activity tracking
- `localStorage Integration`: Implements client-side persistence for immediate activity availability
- `Conditional Rendering`: Shows different activity types with appropriate icons and colors
- `Time Formatting`: Displays human-readable timestamps ("2 hours ago", "yesterday")

*Features:*
- Real-time activity logging for property views, favorite additions/removals, and contact access
- Color-coded activity types with intuitive icons (phone, heart, eye)
- Persistent storage across browser sessions using localStorage
- Activity timeline with chronological sorting and filtering
- Quick action links for each activity (view property, manage favorites)

*Activity Types Tracked:*
- Property Viewing: Automatically logged when users visit property detail pages
- Favorite Management: Tracks when properties are added or removed from favorites
- Contact Access: Records when users successfully access owner contact details
- Property Interactions: Monitors various user engagements with property listings

*Backend Integration:*
- `activityManager.js`: Client-side utility for managing activities in localStorage
- `Activity Types`: Defined constants for consistent activity categorization
- `Data Persistence`: Automatic cleanup of old activities (20 item limit)
- `Format Functions`: Utilities for displaying activities with proper formatting and icons

7.5.2 User Dashboard Integration
Integration of activity tracking into the user dashboard for personalized user experience.

*React Concepts Used:*
- `useEffect`: Loads and refreshes activity data when dashboard becomes visible
- `Component State`: Manages activity display state and user interactions
- `Event Handling`: Handles activity clearing and demo activity addition
- `Responsive Design`: Adapts activity display for different screen sizes

*Features:*
- Recent Activities section in user dashboard showing latest 5 activities
- Clear All functionality for activity management
- Demo activity button for new users to understand the feature
- Activity refresh on page visibility change for real-time updates

#### 7.6 Communication Module

7.6.1 Email Service Integration
Comprehensive email system for notifications, OTP delivery, and password recovery communications.

*Backend Implementation:*
- `Nodemailer Configuration`: SMTP setup with environment-based configuration for reliable email delivery
- `Template System`: Professional HTML email templates for OTP verification, welcome messages, and password reset
- `Security Features`: Time-limited OTP generation, password reset confirmations, and security notifications
- `Error Handling`: Retry mechanisms, failure notifications, and comprehensive error logging
- `Email Types`: Registration verification, login OTP, password reset OTP, and security confirmations

*Password Recovery Integration:*
- `sendPasswordResetOTP()`: Professional HTML templates with security instructions
- `sendPasswordChangeConfirmation()`: Security confirmation emails with account protection tips
- `Template Responsiveness`: Mobile-friendly email designs with clear call-to-action buttons
- `Security Messaging`: Clear instructions about password security and account protection

7.6.2 Notification System
Real-time notification system for user engagement and system alerts.

*React Concepts Used:*
- `useState & useEffect`: Manages notification state and real-time updates
- `Context API`: Global notification state management
- `Toast Components`: Non-intrusive notification displays
- `Real-time Updates`: WebSocket or polling for live notifications
- `Notification Categories`: Different types and priority levels

*Backend Integration:*
- `POST /api/notifications`: Creates new notifications
- `GET /api/notifications`: Retrieves user notifications
- `PUT /api/notifications/:id/read`: Marks notifications as read
- `Real-time Delivery`: WebSocket implementation for instant notifications

#### 7.7 Security Module

7.7.1 Authentication Middleware
Comprehensive security layer for API protection and user verification.

*Backend Implementation:*
- `JWT Token Validation`: Middleware for token verification
- `Role-Based Access Control`: Route-level permission checking
- `Rate Limiting`: API request throttling and DDoS protection
- `CORS Configuration`: Cross-origin request security
- `Helmet Integration`: Security headers for XSS and CSRF protection

7.7.2 Data Validation and Sanitization
Input validation and data security measures.

*Implementation Features:*
- `Express Validator`: Comprehensive input validation
- `Data Sanitization`: SQL injection and XSS prevention
- `File Upload Security`: MIME type checking and size limits
- `Password Security`: bcrypt hashing with salt rounds
- `API Input Validation`: Schema-based request validation

---

## CHAPTER 8
### TECH STACK

1. Front End Technologies
• React.js: A JavaScript library for building user interfaces, used for creating dynamic and interactive components with modern hooks and functional components.
• Vite: A fast build tool and development server for modern web projects providing hot module replacement and optimized builds.
• Tailwind CSS: A utility-first CSS framework for rapid UI development with responsive design and custom gradient backgrounds.
• React Router DOM: A library for routing in React applications, enabling navigation between different pages and role-based redirections.
• React Context API: For global state management including authentication, user data, and application-wide state sharing.
• Lucide React: A library for scalable vector icons providing intuitive visual elements for forms, buttons, and navigation.

2. Back End Technologies
• Node.js: A JavaScript runtime built on Chrome's V8 engine, used for server-side development and API creation.
• Express.js: A minimal and flexible Node.js web application framework for building RESTful APIs and handling HTTP requests.
• JWT (JSON Web Tokens): Used for secure token-based authentication and role-based access control.
• bcryptjs: A library for hashing passwords securely with salt rounds for enhanced security.
• Nodemailer: Email service integration for OTP delivery, password recovery, and security notifications.
• Multer: Middleware for handling multipart/form-data, used for image and video file uploads.

3. Middleware
• CORS (Cross-Origin Resource Sharing): Middleware to enable secure cross-origin requests between frontend and backend.
• Express JSON Parser: Built-in middleware for parsing JSON request bodies and form data.
• Authentication Middleware: Custom JWT token validation middleware for protected routes.
• Role-Based Middleware: Authorization middleware for Admin, Agent, and User role verification.
• Error Handling Middleware: Centralized error handling and response formatting.
• Rate Limiting Middleware: API request throttling and DDoS protection.

4. Database
• MongoDB: A NoSQL document database used for storing application data with flexible schema design.
• Mongoose ODM: An Object Data Modeling library for MongoDB providing schema-based modeling, validation, and type casting.
• Database Indexing: Optimized queries with proper indexing on frequently searched fields.
• Aggregation Pipelines: Complex data aggregation for search, filtering, and analytics.

5. Packages Used

Frontend Dependencies:
• react: Core React library for building user interfaces
• react-dom: React DOM rendering library
• react-router-dom: Client-side routing and navigation
• tailwindcss: Utility-first CSS framework
• lucide-react: Icon library for UI components
• axios: HTTP client for API requests
• react-hook-form: Form handling and validation
• date-fns: Date manipulation and formatting

Frontend DevDependencies:
• vite: Build tool and development server
• eslint: JavaScript linting and code quality
• autoprefixer: CSS vendor prefixing
• postcss: CSS processing and optimization
• tailwindcss: CSS framework configuration

Backend Dependencies:
• express: Web application framework
• mongoose: MongoDB object modeling
• bcryptjs: Password hashing library
• jsonwebtoken: JWT token generation and verification
• nodemailer: Email service integration
• multer: File upload middleware
• cors: Cross-origin resource sharing
• dotenv: Environment variable management
• express-validator: Input validation and sanitization
• nodemon: Development server auto-restart

6. Approach Followed

The project follows a promise-based asynchronous programming approach using modern JavaScript features like async/await for handling asynchronous operations including database queries, API calls, and file operations. This ensures non-blocking I/O operations and better error handling throughout the application. The system uses Mongoose ODM which inherently supports promises and provides elegant MongoDB integration with schema validation and type casting.

7. Architecture: MVC Pattern

The Real Estate Management System adheres to the Model-View-Controller (MVC) architectural pattern:

• Model: Represents the data structure and business logic. Implemented using Mongoose schemas for MongoDB collections including User.js, Property.js, House.js, Land.js, Rental.js, Survey.js, OTP.js, Activity.js, Notification.js, and AdminSettings.js models with proper validation and relationships.

• View: Handles the presentation layer. Built with React components and pages including DashboardUser, DashboardAgent, DashboardAdmin, PropertyForm, PropertyDetails, Login, Register, Profile, Properties, and ForgotPassword components for rendering the user interface with responsive design.

• Controller: Manages the application logic and user input. Handled by Express route controllers including authController, propertyController, adminController, otpController, surveyVerificationController, and uploadController that process requests, interact with models, validate data, and return appropriate responses with proper error handling.

The architecture ensures separation of concerns, maintainability, and scalability while providing clear organization of code components and responsibilities.

---

## CHAPTER 10
### CONCLUSION

    The Real Estate Management System is a comprehensive digital solution that modernizes traditional property management through innovative technology, demonstrating advanced full-stack development using React.js, Node.js/Express.js, and MongoDB architecture. The system implements role-based authentication, dual-verification approach combining automated survey validation with manual admin oversight, email-based OTP contact access and password recovery, Recent Activities tracking with localStorage persistence, and responsive design across all devices. Key technical achievements include dynamic form handling, file upload management, complex database relationships, JWT authentication, comprehensive search and filtering capabilities, and real-time activity monitoring. The production-ready system successfully reduces manual processes, improves transparency in property verification, enhances stakeholder communication, and provides valuable business analytics while maintaining robust security through password hashing, input validation, rate limiting, and comprehensive audit trails, making it an ideal solution for real estate agencies, property developers, and property seekers requiring efficient digital property management.

---