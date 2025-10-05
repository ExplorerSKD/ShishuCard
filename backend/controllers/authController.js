const { generateToken } = require('../utils/generateToken');
const User = require('../models/User.js');

exports.register = async (req, res) => {
  try {
    const userData = req.body;
    const { username, email, password, role } = userData;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Username, email, password, and role are required' 
      });
    }

    // Validate role
    if (!['parent', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be parent, doctor, or admin' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email or username' 
      });
    }

    // Role-specific validation
    if (role === 'doctor') {
      const requiredFields = ['medicalLicense', 'hospitalAffiliation', 'specialization', 'yearsOfExperience'];
      for (const field of requiredFields) {
        if (!userData[field]) {
          return res.status(400).json({ 
            error: `${field} is required for doctor registration` 
          });
        }
      }
    } else if (role === 'parent') {
      if (!userData.phone) {
        return res.status(400).json({ 
          error: 'Phone number is required for parent registration' 
        });
      }
    }

    // Create new user
    const user = await User.create({
      ...userData,
      role
    });

    // Generate token only for approved users (parents and admins are auto-approved)
    let token = null;
    let message = 'Registration successful';
    
    if (user.isApproved) {
      token = generateToken(user);
      message = 'Registration successful! You can now log in.';
    } else {
      message = 'Registration successful! Your doctor account is pending admin approval. You will be notified once approved.';
    }

    res.status(201).json({ 
      success: true,
      message,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      },
      requiresApproval: !user.isApproved
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ 
      error: err.message || 'Registration failed' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Find user by email or username
    const user = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Your account has been deactivated. Please contact support.' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if doctor account is approved
    if (user.role === 'doctor' && !user.isApproved) {
      return res.status(403).json({ 
        error: 'Your doctor account is pending admin approval. Please wait for approval before logging in.',
        pendingApproval: true
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    
    res.json({ 
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        specialization: user.specialization,
        hospitalAffiliation: user.hospitalAffiliation
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: 'Login failed' 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};
