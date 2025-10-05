const express = require('express');
const {
  getBabies,
  getBaby,
  createBaby,
  updateBaby,
  deleteBaby,
  requestVaccineCompletion,
  getVaccinationStats
} = require('../controllers/babyController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Baby management routes
router.route('/')
  .get(getBabies)     // GET /api/babies
  .post(createBaby);  // POST /api/babies

router.route('/stats')
  .get(getVaccinationStats); // GET /api/babies/stats

router.route('/:id')
  .get(getBaby)        // GET /api/babies/:id
  .put(updateBaby)     // PUT /api/babies/:id
  .delete(deleteBaby); // DELETE /api/babies/:id

// Vaccination request routes
router.route('/:id/request-vaccine')
  .post(requestVaccineCompletion); // POST /api/babies/:id/request-vaccine

module.exports = router;