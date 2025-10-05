const express = require('express');
const {
  getChildren,
  getChild,
  createChild,
  updateChild,
  deleteChild
} = require('../controllers/childController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// Routes
router.route('/')
  .get(getChildren)     // GET /api/children
  .post(createChild);   // POST /api/children

router.route('/:id')
  .get(getChild)        // GET /api/children/:id
  .put(updateChild)     // PUT /api/children/:id
  .delete(deleteChild); // DELETE /api/children/:id

module.exports = router;