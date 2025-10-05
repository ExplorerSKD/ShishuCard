import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { toast } from 'react-toastify';
import VaccinationCertificate from './VaccinationCertificate';
import { 
  FaSpinner, FaArrowLeft, FaSyringe, FaCalendarAlt, 
  FaCheckCircle, FaExclamationCircle, FaClock, FaEye,
  FaUser, FaBaby, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaPlus, FaHeart, FaEdit, FaTimes, FaRobot, FaCertificate
} from 'react-icons/fa';

function ChildPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [childData, setChildData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [requestForm, setRequestForm] = useState({
    administerDate: '',
    parentNotes: ''
  });
  const [showCertificate, setShowCertificate] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchChildData();
  }, [id]);

  const fetchChildData = async () => {
    setIsLoading(true);
    try {
      const response = await API.get(`/children/${id}`);
      setChildData(response.data.data);
    } catch (error) {
      console.error('Fetch child data error:', error);
      toast.error('Failed to load child data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestVaccineCompletion = (vaccine, index) => {
    setSelectedVaccine({ ...vaccine, index });
    setShowRequestModal(true);
    setRequestForm({
      administerDate: new Date().toISOString().split('T')[0],
      parentNotes: ''
    });
  };

  const submitVaccinationRequest = async (e) => {
    e.preventDefault();
    
    if (!selectedVaccine || !requestForm.administerDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await API.post('/vaccination/request-completion', {
        childId: childData._id,
        vaccineScheduleIndex: selectedVaccine.index,
        administerDate: requestForm.administerDate,
        parentNotes: requestForm.parentNotes
      });
      
      toast.success('Vaccination completion request submitted successfully!');
      setShowRequestModal(false);
      fetchChildData(); // Refresh data
    } catch (error) {
      console.error('Submit vaccination request error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-600" />;
      case 'overdue':
        return <FaExclamationCircle className="text-red-600" />;
      case 'upcoming':
        return <FaClock className="text-blue-600" />;
      case 'pending_approval':
        return <FaSpinner className="text-yellow-600 animate-spin" />;
      default:
        return <FaCalendarAlt className="text-gray-600" />;
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

  const getPersonalizedAdvice = async (vaccineStatus) => {
    // Placeholder for LLM integration
    const advice = {
      'upcoming': 'Your child\'s upcoming vaccination is important for building immunity. Please schedule an appointment with your healthcare provider.',
      'overdue': 'This vaccination is overdue. Please contact your doctor immediately to schedule the vaccine.',
      'completed': 'Great! This vaccination has been completed. Monitor for any side effects and maintain the vaccination record.',
      'pending_approval': 'Your completion request is under review by the doctor. You will be notified once approved.'
    };
    
    toast.info(advice[vaccineStatus] || 'Please consult with your healthcare provider for personalized advice.');
  };

  const generateVaccinationCertificate = async (vaccine) => {
    const completedVaccines = childData.vaccinationSchedule?.filter(v => v.status === 'completed') || [];
    
    if (completedVaccines.length === 0) {
      toast.warning('No completed vaccinations found for certificate generation');
      return;
    }
    
    // Show certificate modal
    setShowCertificate(true);
    toast.success(`Generating vaccination certificate for ${childData.name}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <FaSpinner className="animate-spin text-blue-500 text-4xl mb-4" />
        <p className="text-gray-600">Loading child records...</p>
      </div>
    );
  }

  if (!childData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Child Not Found</h2>
          <p className="text-gray-600 mb-6">No records found for ID: {id}</p>
          <button
            onClick={() => navigate('/children')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/children')}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              <FaArrowLeft className="mr-2" /> Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{childData.name}</h1>
              <p className="text-gray-600">Vaccination Records & Schedule</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex space-x-3">
            <button
              onClick={() => generateVaccinationCertificate()}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FaCertificate className="mr-2" />
              Generate Certificate
            </button>
          </div>
        </div>

        {/* Child Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaBaby className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-semibold text-gray-800">{calculateAge(childData.dateOfBirth)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-full">
                <FaUser className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-semibold text-gray-800 capitalize">{childData.gender}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <FaCalendarAlt className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-semibold text-gray-800">
                  {new Date(childData.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-3 rounded-full">
                <FaHeart className="text-red-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Group</p>
                <p className="font-semibold text-gray-800">{childData.bloodGroup || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vaccination Schedule */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Vaccination Schedule</h2>
            <p className="text-gray-600">Complete vaccination record and upcoming vaccines</p>
          </div>
          
          <div className="p-6">
            {childData.vaccinationSchedule && childData.vaccinationSchedule.length > 0 ? (
              <div className="space-y-4">
                {childData.vaccinationSchedule.map((vaccine, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${getStatusColor(vaccine.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(vaccine.status)}
                        <div>
                          <h3 className="font-semibold text-lg">{vaccine.vaccineName}</h3>
                          <p className="text-sm opacity-80">{vaccine.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span>
                              <strong>Due:</strong> {new Date(vaccine.dueDate).toLocaleDateString()}
                            </span>
                            <span>
                              <strong>Cost:</strong> {vaccine.cost}
                            </span>
                            {vaccine.administerDate && (
                              <span>
                                <strong>Given:</strong> {new Date(vaccine.administerDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {/* Notes */}
                          {vaccine.parentNotes && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                              <strong>Parent Notes:</strong> {vaccine.parentNotes}
                            </div>
                          )}
                          {vaccine.doctorNotes && (
                            <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                              <strong>Doctor Notes:</strong> {vaccine.doctorNotes}
                            </div>
                          )}
                          {vaccine.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                              <strong>Rejection Reason:</strong> {vaccine.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        {(vaccine.status === 'upcoming' || vaccine.status === 'overdue') && (
                          <button
                            onClick={() => handleRequestVaccineCompletion(vaccine, index)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center space-x-2"
                          >
                            <FaSyringe className="text-sm" />
                            <span>Request Completion</span>
                          </button>
                        )}
                        
                        {vaccine.status === 'completed' && (
                          <button
                            onClick={() => generateVaccinationCertificate(vaccine)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center space-x-2"
                          >
                            <FaCertificate className="text-sm" />
                            <span>Certificate</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => getPersonalizedAdvice(vaccine.status)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm flex items-center space-x-2"
                        >
                          <FaRobot className="text-sm" />
                          <span>AI Advice</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaSyringe className="text-gray-400 text-4xl mb-4 mx-auto" />
                <p className="text-gray-600">No vaccination schedule available</p>
              </div>
            )}
          </div>
        </div>

        {/* Vaccination Request Modal */}
        {showRequestModal && selectedVaccine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Request Vaccine Completion</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800">{selectedVaccine.vaccineName}</h4>
                <p className="text-blue-600 text-sm">{selectedVaccine.description}</p>
                <p className="text-blue-600 text-sm mt-1">
                  <strong>Due Date:</strong> {new Date(selectedVaccine.dueDate).toLocaleDateString()}
                </p>
              </div>
              
              <form onSubmit={submitVaccinationRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Administered *
                  </label>
                  <input
                    type="date"
                    value={requestForm.administerDate}
                    onChange={(e) => setRequestForm({...requestForm, administerDate: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={requestForm.parentNotes}
                    onChange={(e) => setRequestForm({...requestForm, parentNotes: e.target.value})}
                    placeholder="Any additional information about the vaccination..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vaccination Certificate Modal */}
        <VaccinationCertificate
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          childData={childData}
          vaccineFilter="completed"
        />
      </div>
    </div>
  );
}

export default ChildPage;