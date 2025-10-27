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
        password: await bcrypt.hash('admin123', 12),
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
        password: await bcrypt.hash('agent123', 12),
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
        password: await bcrypt.hash('agent123', 12),
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
        password: await bcrypt.hash('user123', 12),
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
        password: await bcrypt.hash('user123', 12),
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

    const createdUsers = await User.insertMany(users);
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

    const properties = [
      {
        title: 'Luxury 3BHK Villa in ECR',
        description: 'Beautiful sea-facing villa with modern amenities, private pool, and garden. Perfect for families looking for a premium lifestyle.',
        type: 'house',
        listingType: 'sale',
        price: 8500000,
        priceNegotiable: true,
        area: 2400,
        areaUnit: 'sqft',
        bedrooms: 3,
        bathrooms: 4,
        parking: 2,
        location: {
          street: 'ECR Main Road',
          area: 'East Coast Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '603112',
          coordinates: {
            latitude: 12.8956,
            longitude: 80.2135
          }
        },
        amenities: ['swimming pool', 'garden', 'security', 'power backup', 'parking', 'gym'],
        images: [
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop'
        ],
        yearBuilt: 2020,
        verificationStatus: 'verified',
        agent: agents[0]._id,
        createdBy: agents[0]._id
      },
      {
        title: 'Modern 2BHK Apartment in Anna Nagar',
        description: 'Well-ventilated apartment in prime location with excellent connectivity. Close to schools, hospitals, and shopping malls.',
        type: 'apartment',
        listingType: 'sale',
        price: 6200000,
        priceNegotiable: true,
        area: 1200,
        areaUnit: 'sqft',
        bedrooms: 2,
        bathrooms: 2,
        parking: 1,
        location: {
          street: '2nd Avenue',
          area: 'Anna Nagar West',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600040',
          coordinates: {
            latitude: 13.0827,
            longitude: 80.2707
          }
        },
        amenities: ['lift', 'power backup', 'security', 'parking', 'water supply'],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'
        ],
        yearBuilt: 2018,
        verificationStatus: 'verified',
        agent: agents[0]._id,
        createdBy: agents[0]._id
      },
      {
        title: 'Agricultural Land - 5 Acres in Coimbatore',
        description: 'Fertile agricultural land with water source. Suitable for organic farming and horticulture. Good road connectivity.',
        type: 'land',
        listingType: 'sale',
        price: 2500000,
        priceNegotiable: true,
        area: 5,
        areaUnit: 'acres',
        location: {
          street: 'Pollachi Road',
          area: 'Sulur',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641402',
          coordinates: {
            latitude: 11.0168,
            longitude: 76.9558
          }
        },
        amenities: ['water source', 'road connectivity', 'electricity'],
        images: [
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1489050204698-48b8b530e2a7?w=800&h=600&fit=crop'
        ],
        verificationStatus: 'verified',
        agent: agents[1]._id,
        createdBy: agents[1]._id
      },
      {
        title: 'Spacious 4BHK House for Rent in T. Nagar',
        description: 'Large family house with traditional architecture. Suitable for joint families. Near Pondy Bazaar.',
        type: 'house',
        listingType: 'rent',
        price: 45000,
        priceNegotiable: false,
        area: 2800,
        areaUnit: 'sqft',
        bedrooms: 4,
        bathrooms: 3,
        parking: 2,
        location: {
          street: 'Usman Road',
          area: 'T. Nagar',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600017',
          coordinates: {
            latitude: 13.0418,
            longitude: 80.2341
          }
        },
        amenities: ['parking', 'power backup', 'water supply', 'security'],
        images: [
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
        ],
        yearBuilt: 1995,
        verificationStatus: 'pending',
        agent: agents[0]._id,
        createdBy: agents[0]._id
      },
      {
        title: '1BHK Studio Apartment for Rent near IT Park',
        description: 'Fully furnished studio apartment perfect for working professionals. High-speed internet and all amenities included.',
        type: 'apartment',
        listingType: 'rent',
        price: 25000,
        priceNegotiable: true,
        area: 600,
        areaUnit: 'sqft',
        bedrooms: 1,
        bathrooms: 1,
        parking: 1,
        location: {
          street: 'OMR Main Road',
          area: 'Sholinganallur',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600119',
          coordinates: {
            latitude: 12.9010,
            longitude: 80.2279
          }
        },
        amenities: ['wifi', 'ac', 'furnished', 'security', 'lift', 'parking'],
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1631079518770-f6b3a42e0fa4?w=800&h=600&fit=crop'
        ],
        yearBuilt: 2019,
        verificationStatus: 'verified',
        agent: agents[1]._id,
        createdBy: agents[1]._id
      },
      {
        title: 'Residential Plot in Upcoming Area',
        description: 'DTCP approved residential plot in developing area. Great investment opportunity with future appreciation potential.',
        type: 'land',
        listingType: 'sale',
        price: 1800000,
        priceNegotiable: true,
        area: 2400,
        areaUnit: 'sqft',
        location: {
          street: 'GST Road',
          area: 'Tambaram',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600045',
          coordinates: {
            latitude: 12.9249,
            longitude: 80.1000
          }
        },
        amenities: ['dtcp approved', 'road connectivity', 'electricity', 'water connection'],
        images: [
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop'
        ],
        verificationStatus: 'pending',
        agent: agents[1]._id,
        createdBy: agents[1]._id
      },
      {
        title: 'Heritage Bungalow in Coonoor Hills',
        description: 'Colonial era bungalow with panoramic hill views. Ideal for vacation home or homestay business. Antique charm with modern comforts.',
        type: 'house',
        listingType: 'sale',
        price: 12000000,
        priceNegotiable: true,
        area: 3500,
        areaUnit: 'sqft',
        bedrooms: 5,
        bathrooms: 4,
        parking: 3,
        location: {
          street: 'Upper Coonoor Road',
          area: 'Coonoor',
          city: 'Nilgiris',
          state: 'Tamil Nadu',
          pincode: '643101',
          coordinates: {
            latitude: 11.3564,
            longitude: 76.7959
          }
        },
        amenities: ['garden', 'fireplace', 'mountain view', 'parking', 'water source'],
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&h=600&fit=crop'
        ],
        yearBuilt: 1920,
        verificationStatus: 'verified',
        agent: agents[0]._id,
        createdBy: agents[0]._id
      },
      {
        title: 'Commercial Office Space in Business District',
        description: 'Premium office space in the heart of business district. Perfect for corporate offices, startups, and professional services.',
        type: 'commercial',
        listingType: 'rent',
        price: 120000,
        priceNegotiable: true,
        area: 4000,
        areaUnit: 'sqft',
        parking: 10,
        location: {
          street: 'Mount Road',
          area: 'Nungambakkam',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600034',
          coordinates: {
            latitude: 13.0642,
            longitude: 80.2480
          }
        },
        amenities: ['lift', 'ac', 'power backup', 'security', 'parking', 'cafeteria'],
        images: [
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop'
        ],
        yearBuilt: 2015,
        verificationStatus: 'verified',
        agent: agents[1]._id,
        createdBy: agents[1]._id
      }
    ];

    const createdProperties = await Property.insertMany(properties);
    console.log(`${createdProperties.length} properties created`);
    return createdProperties;
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