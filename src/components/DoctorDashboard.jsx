import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sendReminderEmail } from '../utils/sendEmail';
import API from '../services/api';
import { toast } from 'react-toastify';


export default function DoctorDashboard() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalVaccinations: 0,
    pendingRequests: 0,
    overdueVaccinations: 0
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Form dark mode state, persisted in localStorage
  const [formDark, setFormDark] = useState(() => {
    const saved = localStorage.getItem('formDark');
    return saved === 'true';
  });
  const toggleFormDarkMode = () => {
    setFormDark(d => {
      localStorage.setItem('formDark', !d);
      return !d;
    });
  };

  // Authentication check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.error('Please login to access dashboard');
      navigate('/login');
      return;
    }
    if (isAuthenticated && user?.role === 'doctor') {
      fetchDoctorData();
    }
  }, [isAuthenticated, loading, navigate, user]);

  const fetchDoctorData = async () => {
    try {
      console.log('Fetching doctor data...');
      
      // Fetch statistics
      const statsResponse = await API.get('/vaccination/statistics');
      console.log('Stats response:', statsResponse.data);
      
      if (statsResponse.data.success) {
        const data = statsResponse.data.data;
        const requestBreakdown = data.requestStatusBreakdown || [];
        const vaccinationBreakdown = data.vaccinationStatusBreakdown || [];
        
        const newStats = {
          totalChildren: data.totalChildren || 0,
          totalVaccinations: data.totalRequests || 0,
          pendingRequests: requestBreakdown.find(s => s._id === 'pending')?.count || 0,
          overdueVaccinations: vaccinationBreakdown.find(s => s._id === 'overdue')?.count || 0
        };
        console.log('Setting stats:', newStats);
        setStats(newStats);
      }
      
      // Fetch pending requests
      const requestsResponse = await API.get('/vaccination/pending-requests');
      console.log('Requests response:', requestsResponse.data);
      
      if (requestsResponse.data.success) {
        const requests = requestsResponse.data.data || [];
        console.log('Setting pending requests:', requests.length, 'requests');
        setPendingRequests(requests);
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Set default stats even on error to prevent UI issues
      setStats({
        totalChildren: 0,
        totalVaccinations: 0,
        pendingRequests: 0,
        overdueVaccinations: 0
      });
      setPendingRequests([]);
      
      toast.error(`Failed to load dashboard data: ${error.response?.data?.error || error.message}`);
    } finally {
      setDashboardLoading(false);
    }
  };
  // Dynamic stats based on actual data
  const statsCards = [
    { label: 'Total Children Registered', value: stats.totalChildren.toString(), trend: '↑ 12%', positive: true },
    { label: 'Vaccinations Administered', value: stats.totalVaccinations.toString(), trend: '↑ 5%', positive: true },
    { label: 'Pending Requests', value: stats.pendingRequests.toString(), trend: '→', positive: null },
    { label: 'Overdue Vaccinations', value: stats.overdueVaccinations.toString(), trend: stats.overdueVaccinations > 0 ? '↑' : '→', positive: stats.overdueVaccinations === 0 },
  ];

  // No hardcoded activities - using real pending requests
//   const handleSendReminder = async (data) => {
    
//   await sendReminderEmail({ parentEmail, childName, vaccineName, dueDate });
//   alert(`Reminder sent to ${parentEmail}`);
// };

const handleApproveRequest = async (requestId) => {
  const doctorNotes = prompt('Add any notes (optional):');
  try {
    await API.put(`/vaccination/approve/${requestId}`, {
      doctorNotes: doctorNotes || '',
      administerDate: new Date().toISOString().split('T')[0]
    });
    toast.success('Vaccination request approved successfully');
    fetchDoctorData(); // Refresh data
  } catch (error) {
    console.error('Error approving request:', error);
    toast.error(error.response?.data?.error || 'Failed to approve vaccination request');
  }
};

const handleRejectRequest = async (requestId) => {
  const reason = prompt('Please provide a reason for rejection:');
  if (reason) {
    try {
      await API.put(`/vaccination/reject/${requestId}`, { 
        rejectionReason: reason,
        doctorNotes: reason
      });
      toast.success('Vaccination request rejected');
      fetchDoctorData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.error || 'Failed to reject vaccination request');
    }
  }
};

const handleSendReminder = async (data) => {
  try {
    await sendReminderEmail(data);
    toast.success(`Reminder sent to ${data.parentEmail}`);
  } catch (error) {
    console.error('Error sending reminder:', error);
    toast.error('Failed to send reminder email');
  }
};

const handleViewRegistrations = () => {
  navigate('/vaccination');
};

const handleViewChildren = () => {
  // For doctors, we should show all children with search functionality
  // Since the search is already built into the dashboard, we can scroll to it
  const searchSection = document.querySelector('.bg-white.rounded-lg.shadow-md');
  if (searchSection) {
    searchSection.scrollIntoView({ behavior: 'smooth' });
  }
};

const handleSearch = async (query) => {
  if (!query || query.trim().length < 2) {
    setSearchResults([]);
    return;
  }

  setSearchLoading(true);
  try {
    const response = await API.get(`/vaccination/search?query=${encodeURIComponent(query.trim())}`);
    if (response.data.success) {
      setSearchResults(response.data.data || []);
    }
  } catch (error) {
    console.error('Search error:', error);
    toast.error('Failed to search children records');
  } finally {
    setSearchLoading(false);
  }
};

const handleChildDetails = async (childId) => {
  try {
    const response = await API.get(`/vaccination/child-history/${childId}`);
    if (response.data.success) {
      // For now, show the child details in the current page or navigate to child page
      navigate(`/child/${childId}`);
    }
  } catch (error) {
    console.error('Error fetching child details:', error);
    toast.error('Failed to load child details');
  }
};

if (loading || dashboardLoading) {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-xl text-gray-600">Loading dashboard...</div>
    </div>
  );
}


  return (
  <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800`}>
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        aria-label="Toggle dark mode"
      >
        Toggle Dark Mode
      </button>
      <div className="dashboard-hero w-full">
      {/* Header */}
      <header className="dashboard-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <div className="flex items-center">
              <img className="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User profile" />
              <span className="ml-2 text-sm font-medium">
                {user?.username || user?.email || 'Doctor'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-card max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Children Records</h3>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search by child name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchLoading && (
              <div className="flex items-center px-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Search Results ({searchResults.length})</h4>
              <div className="space-y-3">
                {searchResults.map((child) => (
                  <div key={child._id} className="bg-white rounded-lg p-4 flex items-center justify-between border">
                    <div>
                      <h5 className="font-semibold text-gray-800">{child.name}</h5>
                      <p className="text-sm text-gray-600">
                        Age: {(() => {
                          const birthDate = new Date(child.dateOfBirth);
                          const today = new Date();
                          const ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
                          return ageMonths < 12 ? `${ageMonths} months` : `${Math.floor(ageMonths / 12)} years`;
                        })()}
                      </p>
                      <div className="flex space-x-4 mt-2 text-xs">
                        <span className="text-green-600">✓ {child.vaccinationSummary?.completed || 0} Completed</span>
                        <span className="text-yellow-600">⏳ {child.vaccinationSummary?.pending_approval || 0} Pending</span>
                        <span className="text-red-600">⚠ {child.vaccinationSummary?.overdue || 0} Overdue</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleChildDetails(child._id)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
            <div className="mt-4 text-center text-gray-500">
              No children found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${stat.positive === true ? 'text-green-600' : stat.positive === false ? 'text-red-600' : 'text-gray-500'}`}>
                        {stat.trend}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">New Registrations</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>View and manage newly registered children for vaccination programs.</p>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleViewRegistrations}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Register New Child
                </button>
              </div>
            </div>
          </div>
          {/* Children Management Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Children Management</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>View and manage all registered children and their vaccination records.</p>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleViewChildren}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  View All Children ({stats.totalChildren})
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pending Vaccination Requests */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Vaccination Requests</h3>
          </div>
          <div className="bg-white overflow-hidden">
            {pendingRequests.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <p>No pending vaccination requests at the moment.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {pendingRequests.slice(0, 5).map((request) => (
                  <li key={request._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-yellow-100">
                          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {request.childName || request.childId?.name || 'Unknown Child'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {request.vaccineName} - {request.status}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Requested: {new Date(request.requestedAt || request.createdAt).toLocaleDateString()}
                          </p>
                          {request.parentNotes && (
                            <p className="text-xs text-blue-600 mt-1">
                              Note: {request.parentNotes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleApproveRequest(request._id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request._id)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Quick Actions Panel */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/vaccination/search')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Search Children
              </button>
              <button
                onClick={() => navigate('/vaccination/requests')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                View All Requests
              </button>
              <button
                onClick={() => navigate('/vaccination/reports')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Generate Reports
              </button>
            </div>
          </div>
        </div>

      </main>
      </div>
    </div>
  );
}