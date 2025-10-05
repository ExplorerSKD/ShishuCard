const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Doctor Management Routes
router.get('/doctors/pending', adminController.getPendingDoctors);
router.get('/doctors', adminController.getAllDoctors);
router.put('/doctors/:id/approve', adminController.approveDoctorAccount);
router.put('/doctors/:id/reject', adminController.rejectDoctorAccount);

// User Management Routes
router.put('/users/:id/deactivate', adminController.deactivateUser);
router.put('/users/:id/reactivate', adminController.reactivateUser);

// Admin Dashboard Routes
router.get('/dashboard/stats', adminController.getAdminStats);

module.exports = router;