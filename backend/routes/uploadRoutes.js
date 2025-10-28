const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { handleUpload } = require('../controllers/uploadController');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`✅ Upload directory created: ${uploadDir}`);
    }
} catch (error) {
    console.error(`❌ Failed to create upload directory: ${error.message}`);
    // Continue without throwing - the app should still work
}

// Multer storage - use memory storage for serverless environments like Vercel
const storage = multer.memoryStorage();

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

router.post('/', upload.single('file'), handleUpload);

module.exports = router;
