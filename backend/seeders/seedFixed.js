const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Property = require('../models/Property');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});

    const users = [
      {
        name: 'Admin User',
        email: 'admin@realestate.com',
        password: 'admin123', // Let the User model hash this
        phone: '+919876543210',
        role: 'admin',
        verified: true,
        address: {
          street: '123 Admin Street',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001'
        }
      },
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.agent@gmail.com',
        password: 'agent123', // Let the User model hash this
        phone: '+919876543211',
        role: 'agent',
        verified: true,
        address: {
          street: '456 Agent Avenue',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600002'
        }
      },
      {
        name: 'Priya Sharma',
        email: 'priya.agent@gmail.com',
        password: 'agent123', // Let the User model hash this
        phone: '+919876543212',
        role: 'agent',
        verified: true,
        address: {
          street: '789 Real Estate Road',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641001'
        }
      },
      {
        name: 'Arjun Patel',
        email: 'arjun.user@gmail.com',
        password: 'user123', // Let the User model hash this
        phone: '+919876543213',
        role: 'user',
        verified: true,
        address: {
          street: '321 User Lane',
          city: 'Madurai',
          state: 'Tamil Nadu',
          pincode: '625001'
        }
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha.user@gmail.com',
        password: 'user123', // Let the User model hash this
        phone: '+919876543214',
        role: 'user',
        verified: true,
        address: {
          street: '654 Customer Circle',
          city: 'Trichy',
          state: 'Tamil Nadu',
          pincode: '620001'
        }
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save(); // This will trigger the pre-save middleware
      createdUsers.push(user);
    }
    
    console.log(`${createdUsers.length} users created`);
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

const seedProperties = async (users) => {
  try {
    // Clear existing properties
    await Property.deleteMany({});

    const agents = users.filter(user => user.role === 'agent');

    const sampleProperties = [
      // Land Properties
      {
        type: 'land',
        title: 'Prime Agricultural Land - 2 Acres',
        description: 'Excellent agricultural land with water facility and proper road connectivity. Perfect for farming or investment purposes.',
        surveyNumber: 'SF-125/2',
        location: {
          district: 'Coimbatore',
          taluk: 'Pollachi',
          area: 'Udumalaipettai',
          address: 'Survey No. 125/2, Udumalaipettai Village, Pollachi Taluk',
          pincode: '642126',
          coordinates: {
            latitude: 10.5897,
            longitude: 77.0127
          }
        },
        squareFeet: 87120, // 2 acres
        price: 1500000,
        ownerDetails: {
          name: 'Ravi Kumar',
          phone: '+919876543210',
          email: 'ravi.kumar@email.com'
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
            caption: 'Main view of the agricultural land',
            isPrimary: true
          },
          {
            url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
            caption: 'Water facility available'
          }
        ],
        uploadedBy: agents[0]._id,
        verificationStatus: 'verified'
      },
      {
        type: 'land',
        title: 'Residential Plot in IT Corridor',
        description: 'Well-located residential plot in developing IT corridor area. Good for villa construction with all amenities nearby.',
        surveyNumber: 'SF-456/1A',
        location: {
          district: 'Chennai',
          taluk: 'Tambaram',
          area: 'Sholinganallur',
          address: 'Plot No. 456/1A, IT Highway, Sholinganallur',
          pincode: '600119',
          coordinates: {
            latitude: 12.8998,
            longitude: 80.2209
          }
        },
        squareFeet: 2400,
        price: 3600000,
        ownerDetails: {
          name: 'Priya Sharma',
          phone: '+919123456789',
          email: 'priya.sharma@email.com'
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
            caption: 'Residential plot overview',
            isPrimary: true
          }
        ],
        uploadedBy: agents[1]._id,
        verificationStatus: 'verified'
      },
      // House Properties
      {
        type: 'house',
        title: 'Modern 3BHK Independent Villa',
        description: 'Beautiful modern villa with contemporary design, spacious rooms, and premium amenities. Located in a gated community.',
        surveyNumber: 'SF-789/3B',
        location: {
          district: 'Madurai',
          taluk: 'Madurai East',
          area: 'Anna Nagar',
          address: 'Plot No. 15, Anna Nagar Extension, Madurai',
          pincode: '625020',
          coordinates: {
            latitude: 9.9252,
            longitude: 78.1198
          }
        },
        squareFeet: 1800,
        price: 8500000,
        ownerDetails: {
          name: 'Arjun Patel',
          phone: '+919988776655',
          email: 'arjun.patel@email.com'
        },
        features: {
          bedrooms: 3,
          bathrooms: 3,
          parking: true,
          furnished: 'semi-furnished',
          amenities: ['swimming pool', 'gym', 'garden', 'security', 'power backup']
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
            caption: 'Front view of the villa',
            isPrimary: true
          },
          {
            url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
            caption: 'Living room interior'
          },
          {
            url: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&h=600&fit=crop',
            caption: 'Modern kitchen'
          }
        ],
        uploadedBy: agents[0]._id,
        verificationStatus: 'verified'
      },
      {
        type: 'house',
        title: 'Traditional 2BHK House',
        description: 'Charming traditional house with modern amenities. Perfect for a small family with good connectivity to schools and hospitals.',
        surveyNumber: 'SF-321/7',
        location: {
          district: 'Salem',
          taluk: 'Salem',
          area: 'Fairlands',
          address: '21, Fairlands Layout, Salem',
          pincode: '636016',
          coordinates: {
            latitude: 11.6643,
            longitude: 78.1460
          }
        },
        squareFeet: 1200,
        price: 4500000,
        ownerDetails: {
          name: 'Meera Nair',
          phone: '+919445566778',
          email: 'meera.nair@email.com'
        },
        features: {
          bedrooms: 2,
          bathrooms: 2,
          parking: true,
          furnished: 'unfurnished',
          amenities: ['garden', 'bore well', 'compound wall']
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
            caption: 'Traditional house exterior',
            isPrimary: true
          },
          {
            url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
            caption: 'Spacious hall'
          }
        ],
        uploadedBy: agents[1]._id,
        verificationStatus: 'verified'
      },
      // Rental Properties
      {
        type: 'rental',
        title: 'Luxury 2BHK Apartment for Rent',
        description: 'Premium furnished apartment in prime location with all modern amenities. Perfect for working professionals.',
        surveyNumber: 'SF-654/12C',
        location: {
          district: 'Chennai',
          taluk: 'Chennai Central',
          area: 'T. Nagar',
          address: 'Flat 12C, Lakshmi Apartments, T. Nagar, Chennai',
          pincode: '600017',
          coordinates: {
            latitude: 13.0415,
            longitude: 80.2334
          }
        },
        squareFeet: 1100,
        price: 25000, // Monthly rent
        ownerDetails: {
          name: 'Lakshmi Devi',
          phone: '+919876501234',
          email: 'lakshmi.devi@email.com'
        },
        features: {
          bedrooms: 2,
          bathrooms: 2,
          parking: true,
          furnished: 'fully-furnished',
          amenities: ['elevator', 'security', 'gym', 'parking', 'power backup']
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
            caption: 'Modern apartment living room',
            isPrimary: true
          },
          {
            url: 'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop',
            caption: 'Bedroom with city view'
          }
        ],
        uploadedBy: agents[0]._id,
        verificationStatus: 'verified'
      },
      {
        type: 'rental',
        title: '1BHK Studio Apartment',
        description: 'Compact and well-designed studio apartment ideal for single professionals or couples. Located in a peaceful residential area.',
        surveyNumber: 'SF-888/5A',
        location: {
          district: 'Coimbatore',
          taluk: 'Coimbatore North',
          area: 'RS Puram',
          address: 'Flat 5A, Green View Apartments, RS Puram',
          pincode: '641002',
          coordinates: {
            latitude: 11.0041,
            longitude: 76.9674
          }
        },
        squareFeet: 650,
        price: 15000, // Monthly rent
        ownerDetails: {
          name: 'Rajesh Kumar',
          phone: '+919123478965',
          email: 'rajesh.kumar@email.com'
        },
        features: {
          bedrooms: 1,
          bathrooms: 1,
          parking: false,
          furnished: 'semi-furnished',
          amenities: ['elevator', 'security', 'water supply']
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1584738766473-61c083514bf4?w=800&h=600&fit=crop',
            caption: 'Studio apartment interior',
            isPrimary: true
          }
        ],
        uploadedBy: agents[1]._id,
        verificationStatus: 'pending_verification'
      }
    ];

    const properties = await Property.insertMany(sampleProperties);
    console.log(`${properties.length} properties created`);
    return properties;
  } catch (error) {
    console.error('Error seeding properties:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    const users = await seedUsers();
    await seedProperties(users);
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@realestate.com / admin123');
    console.log('Agent: rajesh.agent@gmail.com / agent123');
    console.log('Agent: priya.agent@gmail.com / agent123');
    console.log('User: arjun.user@gmail.com / user123');
    console.log('User: sneha.user@gmail.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };