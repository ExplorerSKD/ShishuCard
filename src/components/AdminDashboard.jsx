import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [approvalLoading, setApprovalLoading] = useState(null);
  const [rejectionData, setRejectionData] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingDoctorId, setRejectingDoctorId] = useState(null);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-unauthorized">
        <h2>Access Denied</h2>
        <p>You must be an administrator to view this page.</p>
      </div>
    );
  }

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard statistics');
    }
  };

  // Fetch pending doctors
  const fetchPendingDoctors = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/doctors/pending', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending doctors');
      }

      const data = await response.json();
      if (data.success) {
        setPendingDoctors(data.data);
      }
    } catch (err) {
      console.error('Error fetching pending doctors:', err);
      setError('Failed to load pending doctor approvals');
    }
  };

  // Approve doctor account
  const approveDoctor = async (doctorId) => {
    try {
      setApprovalLoading(doctorId);
      
      const response = await fetch(`http://localhost:3000/api/admin/doctors/${doctorId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvalNotes: 'Account approved by admin'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve doctor');
      }

      const data = await response.json();
      if (data.success) {
        // Remove the approved doctor from pending list
        setPendingDoctors(prev => prev.filter(doc => doc._id !== doctorId));
        
        // Refresh stats
        await fetchStats();
        
        alert('Doctor account approved successfully!');
      }
    } catch (err) {
      console.error('Error approving doctor:', err);
      alert('Failed to approve doctor account');
    } finally {
      setApprovalLoading(null);
    }
  };

  // Show reject modal
  const openRejectModal = (doctorId) => {
    setRejectingDoctorId(doctorId);
    setShowRejectModal(true);
  };

  // Reject doctor account
  const rejectDoctor = async () => {
    if (!rejectionData[rejectingDoctorId]?.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setApprovalLoading(rejectingDoctorId);
      
      const response = await fetch(`http://localhost:3000/api/admin/doctors/${rejectingDoctorId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejectionReason: rejectionData[rejectingDoctorId]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject doctor');
      }

      const data = await response.json();
      if (data.success) {
        // Remove the rejected doctor from pending list
        setPendingDoctors(prev => prev.filter(doc => doc._id !== rejectingDoctorId));
        
        // Refresh stats
        await fetchStats();
        
        // Close modal and reset data
        setShowRejectModal(false);
        setRejectingDoctorId(null);
        setRejectionData(prev => ({ ...prev, [rejectingDoctorId]: '' }));
        
        alert('Doctor account rejected successfully');
      }
    } catch (err) {
      console.error('Error rejecting doctor:', err);
      alert('Failed to reject doctor account');
    } finally {
      setApprovalLoading(null);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchPendingDoctors()]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {user.username}!</p>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({pendingDoctors.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="admin-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Users</h3>
              <div className="stat-number">{stats.users.total}</div>
              <div className="stat-breakdown">
                <span>Parents: {stats.users.parents}</span>
                <span>Doctors: {stats.users.doctors}</span>
                <span>Pending: {stats.users.pendingDoctors}</span>
              </div>
            </div>

            <div className="stat-card">
              <h3>Children</h3>
              <div className="stat-number">{stats.babies.total}</div>
            </div>

            <div className="stat-card">
              <h3>Vaccinations</h3>
              <div className="stat-number">{stats.vaccinations.total}</div>
              <div className="stat-breakdown">
                <span>Pending: {stats.vaccinations.pending}</span>
                <span>Completed: {stats.vaccinations.statusBreakdown.completed}</span>
                <span>Overdue: {stats.vaccinations.statusBreakdown.overdue}</span>
              </div>
            </div>
          </div>

          <div className="recent-registrations">
            <h3>Recent User Registrations</h3>
            <div className="registrations-list">
              {stats.recentRegistrations.map(user => (
                <div key={user._id} className="registration-item">
                  <span className="user-info">
                    <strong>{user.username}</strong> ({user.email})
                  </span>
                  <span className={`user-role ${user.role}`}>{user.role}</span>
                  <span className="registration-date">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
        <div className="admin-pending">
          <h3>Pending Doctor Approvals</h3>
          
          {pendingDoctors.length === 0 ? (
            <div className="no-pending">
              <p>No pending doctor approvals at this time.</p>
            </div>
          ) : (
            <div className="pending-doctors-list">
              {pendingDoctors.map(doctor => (
                <div key={doctor._id} className="doctor-card">
                  <div className="doctor-info">
                    <h4>{doctor.username}</h4>
                    <p><strong>Email:</strong> {doctor.email}</p>
                    {doctor.specialization && (
                      <p><strong>Specialization:</strong> {doctor.specialization}</p>
                    )}
                    {doctor.hospitalAffiliation && (
                      <p><strong>Hospital:</strong> {doctor.hospitalAffiliation}</p>
                    )}
                    {doctor.licenseNumber && (
                      <p><strong>License:</strong> {doctor.licenseNumber}</p>
                    )}
                    <p><strong>Registered:</strong> {new Date(doctor.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="doctor-actions">
                    <button 
                      className="approve-btn"
                      onClick={() => approveDoctor(doctor._id)}
                      disabled={approvalLoading === doctor._id}
                    >
                      {approvalLoading === doctor._id ? 'Approving...' : 'Approve'}
                    </button>
                    
                    <button 
                      className="reject-btn"
                      onClick={() => openRejectModal(doctor._id)}
                      disabled={approvalLoading === doctor._id}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reject Doctor Application</h3>
            <p>Please provide a reason for rejection:</p>
            <textarea
              value={rejectionData[rejectingDoctorId] || ''}
              onChange={(e) => setRejectionData(prev => ({
                ...prev,
                [rejectingDoctorId]: e.target.value
              }))}
              placeholder="Enter rejection reason..."
              rows="4"
              cols="50"
            />
            <div className="modal-actions">
              <button 
                onClick={rejectDoctor}
                disabled={approvalLoading === rejectingDoctorId}
              >
                {approvalLoading === rejectingDoctorId ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingDoctorId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;