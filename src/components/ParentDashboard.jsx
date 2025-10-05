import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { childrenAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaUser, FaBaby, FaCalendarAlt, FaSyringe, FaCheckCircle, 
  FaExclamationCircle, FaClock, FaSpinner, FaPlus, FaEye,
  FaChartLine, FaBell, FaClipboardList
} from 'react-icons/fa';
import './ParentDashboard.css';

const ParentDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalVaccinations: 0,
    completed: 0,
    overdue: 0,
    upcoming: 0,
    pendingApproval: 0
  });
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [newBaby, setNewBaby] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male'
  });

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await childrenAPI.getAll();
      setChildren(response.data.data || []);
      calculateStats(response.data.data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Failed to fetch children data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (childrenData) => {
    let totalVaccinations = 0;
    let completed = 0;
    let overdue = 0;
    let upcoming = 0;
    let pendingApproval = 0;

    childrenData.forEach(child => {
      if (child.vaccinationSummary) {
        const summary = child.vaccinationSummary;
        totalVaccinations += summary.total || 0;
        completed += summary.completed || 0;
        overdue += summary.overdue || 0;
        upcoming += summary.upcoming || 0;
        pendingApproval += summary.pending_approval || 0;
      }
    });

    setStats({
      totalChildren: childrenData.length,
      totalVaccinations,
      completed,
      overdue,
      upcoming,
      pendingApproval
    });
  };

  const handleAddBaby = async (e) => {
    e.preventDefault();
    
    if (!newBaby.name.trim() || !newBaby.dateOfBirth) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await childrenAPI.create({
        name: newBaby.name.trim(),
        dateOfBirth: newBaby.dateOfBirth,
        gender: newBaby.gender
      });

      toast.success('Baby registered successfully!');
      setShowAddBaby(false);
      setNewBaby({ name: '', dateOfBirth: '', gender: 'male' });
      fetchChildren(); // Refresh the list
    } catch (error) {
      console.error('Error adding baby:', error);
      toast.error('Failed to register baby');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'upcoming':
        return 'text-blue-600 bg-blue-100';
      case 'pending_approval':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle />;
      case 'overdue':
        return <FaExclamationCircle />;
      case 'upcoming':
        return <FaClock />;
      case 'pending_approval':
        return <FaSpinner className="animate-spin" />;
      default:
        return <FaCalendarAlt />;
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 1) {
      return 'Newborn';
    } else if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years}y ${months}m` : `${years} years`;
    }
  };

  if (loading) {
    return (
      <div className="parent-dashboard-loading">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Parent Dashboard</h1>
          <p>Welcome back, {user?.username}! Manage your children's vaccination schedules.</p>
        </div>
        <button 
          className="add-baby-btn"
          onClick={() => setShowAddBaby(true)}
        >
          <FaPlus /> Add New Baby
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaBaby />
          </div>
          <div className="stat-content">
            <h3>{stats.totalChildren}</h3>
            <p>Children Registered</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaSyringe />
          </div>
          <div className="stat-content">
            <h3>{stats.totalVaccinations}</h3>
            <p>Total Vaccinations</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <FaExclamationCircle />
          </div>
          <div className="stat-content">
            <h3>{stats.overdue}</h3>
            <p>Overdue</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-content">
            <h3>{stats.upcoming}</h3>
            <p>Upcoming</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <FaSpinner />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingApproval}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
      </div>

      {/* Children List */}
      <div className="children-section">
        <h2>Your Children</h2>
        
        {children.length === 0 ? (
          <div className="no-children">
            <FaBaby className="empty-icon" />
            <h3>No Children Registered</h3>
            <p>Start by adding your first child to track their vaccination schedule.</p>
            <button 
              className="add-first-child-btn"
              onClick={() => setShowAddBaby(true)}
            >
              <FaPlus /> Add First Child
            </button>
          </div>
        ) : (
          <div className="children-grid">
            {children.map((child) => (
              <div key={child._id} className="child-card">
                <div className="child-header">
                  <div className="child-info">
                    <h3>{child.name}</h3>
                    <p className="child-age">{calculateAge(child.dateOfBirth)}</p>
                    <p className="child-gender">{child.gender}</p>
                  </div>
                  <div className="child-avatar">
                    <FaUser />
                  </div>
                </div>

                {/* Vaccination Summary */}
                {child.vaccinationSummary && (
                  <div className="vaccination-summary">
                    <div className="summary-item">
                      <span className="summary-label">Completed:</span>
                      <span className="summary-value completed">
                        {child.vaccinationSummary.completed}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Overdue:</span>
                      <span className="summary-value overdue">
                        {child.vaccinationSummary.overdue}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Upcoming:</span>
                      <span className="summary-value upcoming">
                        {child.vaccinationSummary.upcoming}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Pending:</span>
                      <span className="summary-value pending">
                        {child.vaccinationSummary.pending_approval}
                      </span>
                    </div>
                  </div>
                )}

                {/* Next Vaccination Due */}
                {child.vaccinationSchedule && (
                  <div className="next-vaccination">
                    {(() => {
                      const nextVaccine = child.vaccinationSchedule
                        .filter(v => ['upcoming', 'overdue'].includes(v.status))
                        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
                      
                      if (nextVaccine) {
                        return (
                          <div className={`next-vaccine ${nextVaccine.status}`}>
                            {getStatusIcon(nextVaccine.status)}
                            <div>
                              <p className="vaccine-name">{nextVaccine.vaccineName}</p>
                              <p className="vaccine-date">
                                Due: {new Date(nextVaccine.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="next-vaccine completed">
                          <FaCheckCircle />
                          <p>All current vaccines completed!</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="child-actions">
                  <button 
                    className="view-btn"
                    onClick={() => navigate(`/child/${child._id}`)}
                  >
                    <FaEye /> View Records
                  </button>
                  <button 
                    className="schedule-btn"
                    onClick={() => navigate(`/child/${child._id}`)}
                  >
                    <FaCalendarAlt /> Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Baby Modal */}
      {showAddBaby && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Baby</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAddBaby(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddBaby} className="modal-form">
              <div className="form-group">
                <label htmlFor="babyName">Baby's Name *</label>
                <input
                  type="text"
                  id="babyName"
                  value={newBaby.name}
                  onChange={(e) => setNewBaby({...newBaby, name: e.target.value})}
                  placeholder="Enter baby's full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth *</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={newBaby.dateOfBirth}
                  onChange={(e) => setNewBaby({...newBaby, dateOfBirth: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  value={newBaby.gender}
                  onChange={(e) => setNewBaby({...newBaby, gender: e.target.value})}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddBaby(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                >
                  <FaPlus /> Add Baby
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;