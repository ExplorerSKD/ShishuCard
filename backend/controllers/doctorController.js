const VaccinationRequest = require('../models/VaccinationRequest');
const Baby = require('../models/Baby');

// Get all pending vaccination requests
exports.getPendingRequests = async (req, res) => {
  try {
    // Only doctors and admins can access this
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const requests = await VaccinationRequest.getPendingRequests();
    
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (err) {
    console.error('Get pending requests error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending requests'
    });
  }
};

// Get all vaccination requests (with filters)
exports.getVaccinationRequests = async (req, res) => {
  try {
    // Only doctors and admins can access this
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const { status, priority, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const requests = await VaccinationRequest.find(filter)
      .populate('babyId', 'name dateOfBirth parentEmail')
      .populate('parentId', 'username email phone')
      .populate('reviewedBy', 'username specialization')
      .sort({ priority: -1, requestedAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VaccinationRequest.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error('Get vaccination requests error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vaccination requests'
    });
  }
};

// Approve a vaccination request
exports.approveVaccinationRequest = async (req, res) => {
  try {
    // Only doctors and admins can approve
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const requestId = req.params.id;
    const { doctorNotes, administeredBy, hospitalName, batchNumber, manufacturer } = req.body;

    const vaccinationRequest = await VaccinationRequest.findById(requestId);
    if (!vaccinationRequest) {
      return res.status(404).json({
        success: false,
        error: 'Vaccination request not found'
      });
    }

    if (vaccinationRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request has already been processed'
      });
    }

    // Update the vaccination request
    await vaccinationRequest.approve(req.user.userId, doctorNotes);

    // Update additional details
    if (administeredBy) vaccinationRequest.administeredBy = administeredBy;
    if (hospitalName) vaccinationRequest.hospitalName = hospitalName;
    if (batchNumber) vaccinationRequest.batchNumber = batchNumber;
    if (manufacturer) vaccinationRequest.manufacturer = manufacturer;
    
    await vaccinationRequest.save();

    // Update the baby's vaccination schedule
    const baby = await Baby.findById(vaccinationRequest.babyId);
    if (baby) {
      const vaccine = baby.vaccinationSchedule.id(vaccinationRequest.vaccineId);
      if (vaccine) {
        vaccine.status = 'completed';
        vaccine.completedDate = new Date();
        vaccine.approvedBy = req.user.userId;
        vaccine.doctorNotes = doctorNotes;
        vaccine.approvedAt = new Date();
        await baby.save();
      }
    }

    res.json({
      success: true,
      message: 'Vaccination request approved successfully',
      data: vaccinationRequest
    });
  } catch (err) {
    console.error('Approve vaccination request error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to approve vaccination request'
    });
  }
};

// Reject a vaccination request
exports.rejectVaccinationRequest = async (req, res) => {
  try {
    // Only doctors and admins can reject
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const requestId = req.params.id;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const vaccinationRequest = await VaccinationRequest.findById(requestId);
    if (!vaccinationRequest) {
      return res.status(404).json({
        success: false,
        error: 'Vaccination request not found'
      });
    }

    if (vaccinationRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request has already been processed'
      });
    }

    // Reject the vaccination request
    await vaccinationRequest.reject(req.user.userId, rejectionReason);

    // Update the baby's vaccination schedule
    const baby = await Baby.findById(vaccinationRequest.babyId);
    if (baby) {
      const vaccine = baby.vaccinationSchedule.id(vaccinationRequest.vaccineId);
      if (vaccine) {
        // Reset status based on due date
        const today = new Date();
        const twoWeeksOverdue = new Date();
        twoWeeksOverdue.setDate(today.getDate() - 14);
        
        if (vaccine.dueDate < twoWeeksOverdue) {
          vaccine.status = 'overdue';
        } else {
          vaccine.status = 'upcoming';
        }
        
        vaccine.rejectedBy = req.user.userId;
        vaccine.rejectionReason = rejectionReason;
        await baby.save();
      }
    }

    res.json({
      success: true,
      message: 'Vaccination request rejected',
      data: vaccinationRequest
    });
  } catch (err) {
    console.error('Reject vaccination request error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to reject vaccination request'
    });
  }
};

// Get doctor dashboard statistics
exports.getDoctorStats = async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const [
      totalBabies,
      pendingRequests,
      approvedToday,
      overdueBabies,
      requestStats
    ] = await Promise.all([
      Baby.countDocuments({ isActive: true }),
      VaccinationRequest.countDocuments({ status: 'pending' }),
      VaccinationRequest.countDocuments({ 
        status: 'approved',
        reviewedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      Baby.countDocuments({ 
        'vaccinationSchedule.status': 'overdue',
        isActive: true 
      }),
      VaccinationRequest.getRequestStatistics()
    ]);

    const stats = {
      totalBabies,
      pendingRequests,
      approvedToday,
      overdueBabies,
      requestBreakdown: requestStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Get doctor stats error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor statistics'
    });
  }
};

// Search babies by name (for doctors)
exports.searchBabies = async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const babies = await Baby.find({
      isActive: true,
      name: { $regex: query, $options: 'i' }
    })
    .populate('parentId', 'username email phone')
    .limit(20);

    res.json({
      success: true,
      data: babies,
      count: babies.length
    });
  } catch (err) {
    console.error('Search babies error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to search babies'
    });
  }
};