const User = require('../models/User');
const Baby = require('../models/Baby');
const VaccinationRequest = require('../models/VaccinationRequest');

// Get all pending doctor approvals
exports.getPendingDoctors = async (req, res) => {
  try {
    // Only admins can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const pendingDoctors = await User.find({ 
      role: 'doctor',
      isApproved: false,
      isActive: true
    })
    .select('-password')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingDoctors,
      count: pendingDoctors.length
    });
  } catch (err) {
    console.error('Get pending doctors error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending doctor approvals'
    });
  }
};

// Get all doctors (approved and pending)
exports.getAllDoctors = async (req, res) => {
  try {
    // Only admins can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const { status } = req.query;
    const filter = { role: 'doctor', isActive: true };
    
    if (status === 'approved') {
      filter.isApproved = true;
    } else if (status === 'pending') {
      filter.isApproved = false;
    }

    const doctors = await User.find(filter)
      .select('-password')
      .populate('approvedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: doctors,
      count: doctors.length
    });
  } catch (err) {
    console.error('Get all doctors error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctors'
    });
  }
};

// Approve a doctor account
exports.approveDoctorAccount = async (req, res) => {
  try {
    // Only admins can approve doctors
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const doctorId = req.params.id;
    const { approvalNotes } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        error: 'User is not a doctor'
      });
    }

    if (doctor.isApproved) {
      return res.status(400).json({
        success: false,
        error: 'Doctor is already approved'
      });
    }

    // Approve the doctor
    doctor.isApproved = true;
    doctor.approvedBy = req.user.userId;
    doctor.approvedAt = new Date();
    
    if (approvalNotes) {
      doctor.approvalNotes = approvalNotes;
    }

    await doctor.save();

    // Here you could send an approval email to the doctor
    // await sendApprovalEmail(doctor.email, doctor.username);

    res.json({
      success: true,
      message: 'Doctor account approved successfully',
      data: {
        id: doctor._id,
        username: doctor.username,
        email: doctor.email,
        specialization: doctor.specialization,
        hospitalAffiliation: doctor.hospitalAffiliation,
        isApproved: doctor.isApproved,
        approvedAt: doctor.approvedAt
      }
    });
  } catch (err) {
    console.error('Approve doctor account error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to approve doctor account'
    });
  }
};

// Reject a doctor account
exports.rejectDoctorAccount = async (req, res) => {
  try {
    // Only admins can reject doctors
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const doctorId = req.params.id;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        error: 'User is not a doctor'
      });
    }

    if (doctor.isApproved) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reject an approved doctor. Deactivate instead.'
      });
    }

    // Reject the doctor (deactivate account)
    doctor.isActive = false;
    doctor.rejectionReason = rejectionReason;
    doctor.approvedBy = req.user.userId; // Track who processed the request
    doctor.approvedAt = new Date();

    await doctor.save();

    // Here you could send a rejection email to the doctor
    // await sendRejectionEmail(doctor.email, doctor.username, rejectionReason);

    res.json({
      success: true,
      message: 'Doctor account rejected and deactivated',
      data: {
        id: doctor._id,
        username: doctor.username,
        email: doctor.email,
        rejectionReason: doctor.rejectionReason
      }
    });
  } catch (err) {
    console.error('Reject doctor account error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to reject doctor account'
    });
  }
};

// Get admin dashboard statistics
exports.getAdminStats = async (req, res) => {
  try {
    // Only admins can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const [
      totalUsers,
      totalParents,
      totalDoctors,
      pendingDoctors,
      activeDoctors,
      totalBabies,
      totalVaccinations,
      pendingRequests,
      recentRegistrations
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'parent', isActive: true }),
      User.countDocuments({ role: 'doctor', isActive: true }),
      User.countDocuments({ role: 'doctor', isApproved: false, isActive: true }),
      User.countDocuments({ role: 'doctor', isApproved: true, isActive: true }),
      Baby.countDocuments({ isActive: true }),
      VaccinationRequest.countDocuments({ status: 'approved' }),
      VaccinationRequest.countDocuments({ status: 'pending' }),
      User.find({ isActive: true })
        .select('username email role createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Get vaccination status breakdown
    const babies = await Baby.find({ isActive: true });
    const vaccinationStats = {
      upcoming: 0,
      overdue: 0,
      completed: 0,
      pending_approval: 0
    };

    babies.forEach(baby => {
      baby.vaccinationSchedule.forEach(vaccine => {
        if (vaccinationStats[vaccine.status] !== undefined) {
          vaccinationStats[vaccine.status]++;
        }
      });
    });

    const stats = {
      users: {
        total: totalUsers,
        parents: totalParents,
        doctors: totalDoctors,
        pendingDoctors,
        activeDoctors
      },
      babies: {
        total: totalBabies
      },
      vaccinations: {
        total: totalVaccinations,
        pending: pendingRequests,
        statusBreakdown: vaccinationStats
      },
      recentRegistrations
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Get admin stats error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin statistics'
    });
  }
};

// Deactivate a user account
exports.deactivateUser = async (req, res) => {
  try {
    // Only admins can deactivate users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const userId = req.params.id;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate admin accounts'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        error: 'User is already deactivated'
      });
    }

    // Deactivate the user
    user.isActive = false;
    user.deactivationReason = reason;
    user.deactivatedBy = req.user.userId;
    user.deactivatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'User account deactivated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error('Deactivate user error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate user account'
    });
  }
};

// Reactivate a user account
exports.reactivateUser = async (req, res) => {
  try {
    // Only admins can reactivate users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        error: 'User is already active'
      });
    }

    // Reactivate the user
    user.isActive = true;
    user.reactivatedBy = req.user.userId;
    user.reactivatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'User account reactivated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error('Reactivate user error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate user account'
    });
  }
};