import React, { useState, useEffect } from 'react';
import { childrenAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaBirthdayCake, FaEdit, FaEye, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ChildrenList = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchChildren();
    }
  }, [isAuthenticated]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await childrenAPI.getAll();
      setChildren(response.data.data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Failed to fetch children list');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChild = (childId) => {
    navigate(`/child/${childId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years}y ${months}m` : `${years} years`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <FaSpinner className="animate-spin text-blue-500 text-3xl" />
        <span className="ml-2 text-gray-600">Loading children...</span>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <FaUser className="mx-auto text-6xl text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Children Registered</h3>
        <p className="text-gray-500 mb-6">Start by registering your first child for vaccination tracking.</p>
        <button
          onClick={() => navigate('/vaccination')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Register First Child
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Children Management</h1>
          <p className="text-gray-600 mt-1">Manage vaccination records for registered children</p>
        </div>
        <button
          onClick={() => navigate('/vaccination')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <FaUser className="mr-2" />
          Register New Child
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child) => (
          <div key={child._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <FaUser className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{child.name}</h3>
                  <p className="text-sm text-gray-500">ID: {child._id.slice(-6)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-gray-600">
                <FaBirthdayCake className="mr-2 text-sm" />
                <span className="text-sm">
                  Born: {formatDate(child.dateOfBirth)} ({calculateAge(child.dateOfBirth)})
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="capitalize">Gender: {child.gender}</span>
              </div>
              {child.address && (
                <div className="text-sm text-gray-600">
                  Location: {child.address.city || child.address.street || 'Not specified'}
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleViewChild(child._id)}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 transition flex items-center justify-center text-sm"
              >
                <FaEye className="mr-1" />
                View Records
              </button>
              <button
                onClick={() => handleViewChild(child._id)}
                className="bg-gray-200 text-gray-700 py-2 px-3 rounded hover:bg-gray-300 transition flex items-center text-sm"
              >
                <FaEdit className="mr-1" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-gray-500">
        <p>Total: {children.length} child{children.length !== 1 ? 'ren' : ''} registered</p>
      </div>
    </div>
  );
};

export default ChildrenList;