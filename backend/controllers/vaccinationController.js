const Child = require('../models/Child');
const VaccinationRequest = require('../models/VaccinationRequest');
const User = require('../models/User');

// Parent creates a request to mark vaccine as completed
exports.requestVaccineCompletion = async (req, res) => {
  try {
    const { childId, vaccineScheduleIndex, administerDate, parentNotes, proofDocument } = req.body;
    const parentEmail = req.currentUser.email;

    // Verify child belongs to parent
    const child = await Child.findOne({ _id: childId, parentEmail });
    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found or access denied'
      });
    }

    // Verify vaccine exists in schedule
    if (!child.vaccinationSchedule[vaccineScheduleIndex]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vaccine schedule index'
      });
    }

    const vaccine = child.vaccinationSchedule[vaccineScheduleIndex];
    
    // Check if already completed or pending
    if (vaccine.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Vaccine is already marked as completed'
      });
    }

    if (vaccine.status === 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: 'A completion request is already pending for this vaccine'
      });
    }

    // Create vaccination request
    const vaccinationRequest = new VaccinationRequest({
      childId,
      vaccineScheduleIndex,
      parentEmail,
      vaccineName: vaccine.vaccineName,
      scheduledDate: vaccine.dueDate,
      requestedCompletionDate: new Date(administerDate),
      parentNotes: parentNotes || '',
      attachments: proofDocument ? [proofDocument] : []
    });

    await vaccinationRequest.save();

    // Update vaccine status to pending_approval
    child.vaccinationSchedule[vaccineScheduleIndex].status = 'pending_approval';
    child.vaccinationSchedule[vaccineScheduleIndex].parentNotes = parentNotes || '';
    await child.save();

    res.status(201).json({
      success: true,
      message: 'Vaccination completion request submitted successfully',
      data: vaccinationRequest
    });
  } catch (err) {
    console.error('Request vaccine completion error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to submit vaccination request'
    });
  }
};

// Doctor views all pending vaccination requests
exports.getPendingRequests = async (req, res) => {
  try {
    if (req.currentUser.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only doctors can view vaccination requests.'
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

// Doctor approves a vaccination request
exports.approveVaccinationRequest = async (req, res) => {
  try {
    if (req.currentUser.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only doctors can approve vaccinations.'
      });
    }

    const { requestId } = req.params;
    const { doctorNotes, administerDate } = req.body;

    const request = await VaccinationRequest.findById(requestId)
      .populate('childId');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Vaccination request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request has already been reviewed'
      });
    }

    // Approve the request
    await request.approve(req.currentUser.userId, doctorNotes);

    // Update the child's vaccination schedule
    const child = request.childId;
    const vaccine = child.vaccinationSchedule[request.vaccineScheduleIndex];
    
    vaccine.status = 'completed';
    vaccine.administerDate = administerDate || request.requestedCompletionDate;
    vaccine.approvedBy = req.currentUser.userId;
    vaccine.approvedAt = new Date();
    vaccine.doctorNotes = doctorNotes || '';

    await child.save();

    res.json({
      success: true,
      message: 'Vaccination request approved successfully',
      data: request
    });
  } catch (err) {
    console.error('Approve vaccination request error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to approve vaccination request'
    });
  }
};

// Doctor rejects a vaccination request
exports.rejectVaccinationRequest = async (req, res) => {
  try {
    if (req.currentUser.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only doctors can reject vaccinations.'
      });
    }

    const { requestId } = req.params;
    const { rejectionReason, doctorNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const request = await VaccinationRequest.findById(requestId)
      .populate('childId');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Vaccination request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request has already been reviewed'
      });
    }

    // Reject the request
    await request.reject(req.currentUser.userId, rejectionReason);
    if (doctorNotes) {
      request.doctorNotes = doctorNotes;
      await request.save();
    }

    // Update the child's vaccination schedule - set back to original status
    const child = request.childId;
    const vaccine = child.vaccinationSchedule[request.vaccineScheduleIndex];
    
    // Determine original status based on due date
    const today = new Date();
    if (vaccine.dueDate < today) {
      vaccine.status = 'overdue';
    } else {
      vaccine.status = 'upcoming';
    }
    
    vaccine.rejectionReason = rejectionReason;
    vaccine.doctorNotes = doctorNotes || '';

    await child.save();

    res.json({
      success: true,
      message: 'Vaccination request rejected',
      data: request
    });
  } catch (err) {
    console.error('Reject vaccination request error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to reject vaccination request'
    });
  }
};

// Get vaccination requests for a parent
exports.getParentRequests = async (req, res) => {
  try {
    const parentEmail = req.currentUser.email;
    const requests = await VaccinationRequest.getRequestsByParent(parentEmail);
    
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (err) {
    console.error('Get parent requests error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vaccination requests'
    });
  }
};

// Get vaccination statistics for admin/doctor dashboard
exports.getVaccinationStats = async (req, res) => {
  try {
    if (!['admin', 'doctor'].includes(req.currentUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const [requestStats, childrenStats] = await Promise.all([
      VaccinationRequest.getRequestStatistics(),
      Child.aggregate([
        {
          $unwind: '$vaccinationSchedule'
        },
        {
          $group: {
            _id: '$vaccinationSchedule.status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const totalChildren = await Child.countDocuments({ isActive: true });
    const totalRequests = await VaccinationRequest.countDocuments();

    res.json({
      success: true,
      data: {
        totalChildren,
        totalRequests,
        requestStatusBreakdown: requestStats,
        vaccinationStatusBreakdown: childrenStats
      }
    });
  } catch (err) {
    console.error('Get vaccination stats error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vaccination statistics'
    });
  }
};

// Search children by name (for doctors)
exports.searchChildren = async (req, res) => {
  try {
    if (req.currentUser.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only doctors can search children records.'
      });
    }

    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const children = await Child.find({
      name: new RegExp(query, 'i'),
      isActive: true
    })
    .select('name dateOfBirth gender parentEmail vaccinationSchedule createdAt')
    .limit(20);

    // Add vaccination summary for each child
    const childrenWithSummary = children.map(child => ({
      ...child.toObject(),
      vaccinationSummary: child.getVaccinationSummary()
    }));

    res.json({
      success: true,
      data: childrenWithSummary,
      count: childrenWithSummary.length
    });
  } catch (err) {
    console.error('Search children error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to search children records'
    });
  }
};

// Get detailed vaccination history for a child (for doctors)
exports.getChildVaccinationHistory = async (req, res) => {
  try {
    if (req.currentUser.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only doctors can view vaccination history.'
      });
    }

    const { childId } = req.params;
    const child = await Child.findById(childId)
      .populate('vaccinationSchedule.approvedBy', 'username specialization hospitalAffiliation');

    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found'
      });
    }

    // Get related vaccination requests
    const requests = await VaccinationRequest.find({ childId })
      .populate('reviewedBy', 'username specialization')
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      data: {
        child,
        vaccinationSummary: child.getVaccinationSummary(),
        requests
      }
    });
  } catch (err) {
    console.error('Get child vaccination history error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vaccination history'
    });
  }
};