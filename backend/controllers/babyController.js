const Baby = require('../models/Baby');
const VaccinationRequest = require('../models/VaccinationRequest');
const User = require('../models/User');

// Get all babies for a parent
exports.getBabies = async (req, res) => {
  try {
    let babies;
    
    if (req.user.role === 'parent') {
      // Parents can only see their own babies
      babies = await Baby.find({ 
        parentId: req.user.userId,
        isActive: true 
      }).sort({ createdAt: -1 });
    } else if (req.user.role === 'doctor' || req.user.role === 'admin') {
      // Doctors and admins can see all babies
      babies = await Baby.find({ isActive: true })
        .populate('parentId', 'username email phone')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update vaccination status for each baby
    for (let baby of babies) {
      await baby.updateVaccinationStatus();
    }

    res.json({
      success: true,
      data: babies,
      count: babies.length
    });
  } catch (err) {
    console.error('Get babies error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch babies'
    });
  }
};

// Get a single baby by ID
exports.getBaby = async (req, res) => {
  try {
    const baby = await Baby.findById(req.params.id)
      .populate('parentId', 'username email phone');

    if (!baby) {
      return res.status(404).json({
        success: false,
        error: 'Baby not found'
      });
    }

    // Check permission
    if (req.user.role === 'parent' && baby.parentId._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update vaccination status
    await baby.updateVaccinationStatus();

    // Get vaccination requests for this baby
    const vaccinationRequests = await VaccinationRequest.find({ babyId: baby._id })
      .populate('reviewedBy', 'username specialization')
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      data: {
        ...baby.toObject(),
        vaccinationRequests
      }
    });
  } catch (err) {
    console.error('Get baby error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch baby details'
    });
  }
};

// Create a new baby
exports.createBaby = async (req, res) => {
  try {
    // Only parents can create babies
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can register babies'
      });
    }

    const babyData = {
      ...req.body,
      parentId: req.user.userId,
      parentEmail: req.currentUser.email
    };

    const baby = new Baby(babyData);
    
    // Generate vaccination schedule
    baby.vaccinationSchedule = baby.generateVaccinationSchedule();
    
    await baby.save();

    res.status(201).json({
      success: true,
      message: 'Baby registered successfully with vaccination schedule',
      data: baby
    });
  } catch (err) {
    console.error('Create baby error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to register baby'
    });
  }
};

// Update a baby
exports.updateBaby = async (req, res) => {
  try {
    const baby = await Baby.findById(req.params.id);

    if (!baby) {
      return res.status(404).json({
        success: false,
        error: 'Baby not found'
      });
    }

    // Check permission
    if (req.user.role === 'parent' && baby.parentId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update baby
    Object.assign(baby, req.body);
    await baby.save();

    res.json({
      success: true,
      message: 'Baby updated successfully',
      data: baby
    });
  } catch (err) {
    console.error('Update baby error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to update baby'
    });
  }
};

// Delete a baby (soft delete)
exports.deleteBaby = async (req, res) => {
  try {
    const baby = await Baby.findById(req.params.id);

    if (!baby) {
      return res.status(404).json({
        success: false,
        error: 'Baby not found'
      });
    }

    // Check permission
    if (req.user.role === 'parent' && baby.parentId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Soft delete
    baby.isActive = false;
    await baby.save();

    res.json({
      success: true,
      message: 'Baby record deactivated successfully'
    });
  } catch (err) {
    console.error('Delete baby error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete baby'
    });
  }
};

// Request vaccine completion
exports.requestVaccineCompletion = async (req, res) => {
  try {
    // Only parents can request vaccine completion
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can request vaccine completion'
      });
    }

    const { babyId, vaccineId, requestedCompletionDate, parentNotes } = req.body;

    const baby = await Baby.findById(babyId);
    if (!baby) {
      return res.status(404).json({
        success: false,
        error: 'Baby not found'
      });
    }

    // Check if baby belongs to the parent
    if (baby.parentId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Find the vaccine in the schedule
    const vaccine = baby.vaccinationSchedule.id(vaccineId);
    if (!vaccine) {
      return res.status(404).json({
        success: false,
        error: 'Vaccine not found in schedule'
      });
    }

    // Check if vaccine is already completed or pending
    if (vaccine.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Vaccine is already completed'
      });
    }

    if (vaccine.status === 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: 'Vaccine completion request is already pending'
      });
    }

    // Create vaccination request
    const vaccinationRequest = new VaccinationRequest({
      babyId,
      vaccineId,
      parentId: req.user.userId,
      vaccineName: vaccine.vaccineName,
      scheduledDate: vaccine.dueDate,
      requestedCompletionDate: new Date(requestedCompletionDate),
      parentNotes
    });

    await vaccinationRequest.save();

    // Update vaccine status
    vaccine.status = 'pending_approval';
    vaccine.requestedAt = new Date();
    vaccine.parentNotes = parentNotes;
    await baby.save();

    res.status(201).json({
      success: true,
      message: 'Vaccine completion request submitted successfully',
      data: vaccinationRequest
    });
  } catch (err) {
    console.error('Request vaccine completion error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to submit vaccine completion request'
    });
  }
};

// Get vaccination statistics for parent dashboard
exports.getVaccinationStats = async (req, res) => {
  try {
    let stats;
    
    if (req.user.role === 'parent') {
      // Get stats for parent's babies
      const babies = await Baby.find({ 
        parentId: req.user.userId,
        isActive: true 
      });

      stats = {
        totalBabies: babies.length,
        totalVaccines: 0,
        upcoming: 0,
        overdue: 0,
        completed: 0,
        pending: 0
      };

      babies.forEach(baby => {
        baby.vaccinationSchedule.forEach(vaccine => {
          stats.totalVaccines++;
          stats[vaccine.status]++;
        });
      });
    } else if (req.user.role === 'doctor' || req.user.role === 'admin') {
      // Get overall system stats
      const babies = await Baby.find({ isActive: true });
      const pendingRequests = await VaccinationRequest.countDocuments({ status: 'pending' });
      
      stats = {
        totalBabies: babies.length,
        totalVaccines: 0,
        upcoming: 0,
        overdue: 0,
        completed: 0,
        pending: 0,
        pendingRequests
      };

      babies.forEach(baby => {
        baby.vaccinationSchedule.forEach(vaccine => {
          stats.totalVaccines++;
          stats[vaccine.status]++;
        });
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Get vaccination stats error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vaccination statistics'
    });
  }
};