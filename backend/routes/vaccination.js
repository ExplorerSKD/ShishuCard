const express = require('express');
const router = express.Router();
const vaccinationController = require('../controllers/vaccinationController');
const { protect } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Parent routes
router.post('/request-completion', vaccinationController.requestVaccineCompletion);
router.get('/my-requests', vaccinationController.getParentRequests);

// Doctor routes
router.get('/pending-requests', vaccinationController.getPendingRequests);
router.put('/approve/:requestId', vaccinationController.approveVaccinationRequest);
router.put('/reject/:requestId', vaccinationController.rejectVaccinationRequest);
router.get('/search', vaccinationController.searchChildren);
router.get('/child-history/:childId', vaccinationController.getChildVaccinationHistory);

// Admin/Doctor statistics
router.get('/statistics', vaccinationController.getVaccinationStats);

module.exports = router;