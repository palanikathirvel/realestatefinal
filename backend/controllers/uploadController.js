const fs = require('fs');

// Simple upload controller: multer middleware will have saved file info on req.file
const handleUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Read the uploaded file and convert to base64
        const fileBuffer = fs.readFileSync(req.file.path);
        const base64Data = fileBuffer.toString('base64');
        const mimeType = req.file.mimetype;
        const dataUrl = `data:${mimeType};base64,${base64Data}`;

        // Optionally delete the file from disk after conversion
        fs.unlinkSync(req.file.path);

        res.json({ 
            success: true, 
            file: { 
                base64: dataUrl, 
                originalname: req.file.originalname, 
                mimetype: mimeType 
            } 
        });
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up file if exists
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
};

module.exports = { handleUpload };
