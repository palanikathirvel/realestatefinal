const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

// Import User model
const User = require('./models/User');


const createAdmin = async () => {
    try {
        // Connect to MongoDB using your existing connection string
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://manickmanick37_db_user:9F28HiGkFm4k6Rpq@cluster0.ee2n9b6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        if (!mongoUri || typeof mongoUri !== 'string') {
            throw new Error('MONGODB_URI is not set. Please set it in your .env file or provide a valid connection string.');
        }
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const adminExists = await User.findOne({
            $or: [
                { email: 'admin@realestate.com' },
                { email: 'admin@realestateconnect.com' },
                { role: 'admin' }
            ]
        });

        if (adminExists) {
            console.log('❌ Admin already exists:');
            console.log('Email:', adminExists.email);
            console.log('Role:', adminExists.role);
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const admin = await User.create({
            name: "Admin User",
            email: "admin@realestate.com",  // Matches your test file
            password: hashedPassword,
            phone: "+919342785145",
            role: "admin",
            status: "active",
            emailVerified: true,  // Skip email verification for admin
            createdAt: new Date()
        });

        console.log('🎉 Admin created successfully!');
        console.log('📧 Email: admin@realestate.com');
        console.log('🔒 Password: admin123');
        console.log('🆔 Admin ID:', admin._id);
        console.log('👤 Role:', admin.role);

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the function
createAdmin();