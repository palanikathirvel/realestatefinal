const express = require('express');
const { getAllUsers } = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Admin-only route to get all users
router.get('/all', authenticateToken, requireAdmin, getAllUsers);

module.exports = router;