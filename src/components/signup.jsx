import React, { useState } from "react";
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaArrowRight,
  FaHospital,
  FaIdCard,
  FaEye,
  FaEyeSlash,
  FaUserAlt,
  FaPhone,
  FaHome,
} from "react-icons/fa";

const UnifiedSignup = () => {
  const { theme } = useTheme();
  const { register, loading } = useAuth();
  const [userType, setUserType] = useState("parent"); // 'parent', 'doctor', 'admin'
  const [formData, setFormData] = useState({
    // Common fields
    username: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Parent-specific fields
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: ""
    },

    // Doctor-specific fields
    medicalLicense: "",
    hospitalAffiliation: "",
    specialization: "",
    yearsOfExperience: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Invalid email format");
      return;
    }

    // User type specific validation
    if (userType === "doctor") {
      if (!formData.medicalLicense.trim()) {
        setError("Medical license is required for doctors");
        return;
      }
      if (!formData.hospitalAffiliation.trim()) {
        setError("Hospital affiliation is required for doctors");
        return;
      }
      if (!formData.specialization.trim()) {
        setError("Specialization is required for doctors");
        return;
      }
      if (!formData.yearsOfExperience || formData.yearsOfExperience < 0) {
        setError("Years of experience is required for doctors");
        return;
      }
    } else if (userType === "parent") {
      if (!formData.phone.trim()) {
        setError("Phone number is required for parents");
        return;
      }
      if (formData.phone.length < 10) {
        setError("Phone number must be at least 10 digits");
        return;
      }
    }

    // Prepare registration data based on user type
    const registrationData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: userType,
    };

    // Add role-specific data
    if (userType === "doctor") {
      registrationData.medicalLicense = formData.medicalLicense;
      registrationData.hospitalAffiliation = formData.hospitalAffiliation;
      registrationData.specialization = formData.specialization;
      registrationData.yearsOfExperience = parseInt(formData.yearsOfExperience);
    } else if (userType === "parent") {
      registrationData.phone = formData.phone;
      if (formData.address.street || formData.address.city) {
        registrationData.address = formData.address;
      }
    }

    const result = await register(registrationData);

    if (result.success) {
      // Redirect based on user role and approval status
      if (result.user.role === 'admin') {
        navigate("/admin-dashboard");
      } else if (result.user.role === 'doctor') {
        if (result.user.isApproved) {
          navigate("/doctor-dashboard");
        } else {
          // Doctor pending approval
          navigate("/login", { 
            state: { 
              message: "Registration successful! Your doctor account is pending admin approval. You will be notified once approved." 
            }
          });
        }
      } else {
        // Parent
        navigate("/children");
      }
    } else {
      setError(result.error);
    }
  };
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-blue-200 opacity-20"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-blue-300 opacity-20"></div>

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 dark:bg-blue-900 py-6 px-8 text-center">
            <h1 className="text-2xl font-bold text-white dark:text-blue-200">
              Create Your Account
            </h1>
            <p className="text-blue-100 dark:text-blue-300 mt-1">
              Join our vaccination tracking platform
            </p>
          </div>

          {/* User Type Toggle */}
          <div className="flex justify-center mt-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setUserType("parent")}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  userType === "parent"
                    ? "bg-blue-600 dark:bg-blue-900 text-white dark:text-blue-200"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Parent
              </button>
              <button
                type="button"
                onClick={() => setUserType("doctor")}
                className={`px-4 py-2 text-sm font-medium ${
                  userType === "doctor"
                    ? "bg-blue-600 dark:bg-blue-900 text-white dark:text-blue-200"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => setUserType("admin")}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  userType === "admin"
                    ? "bg-blue-600 dark:bg-blue-900 text-white dark:text-blue-200"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Common Username Field */}
              <div className="space-y-2 mb-5">
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserAlt className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Your username"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>
              </div>

              {/* Role-specific fields */}
              {userType === "doctor" && (
                <div className="space-y-5 mb-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Medical License */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Medical License
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaIdCard className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="medicalLicense"
                          value={formData.medicalLicense}
                          onChange={handleChange}
                          placeholder="Medical License Number"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* Hospital Affiliation */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Hospital Affiliation
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaHospital className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="hospitalAffiliation"
                          value={formData.hospitalAffiliation}
                          onChange={handleChange}
                          placeholder="Hospital Name"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Specialization */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Specialization
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaUser className="text-gray-400" />
                        </div>
                        <select
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          required
                        >
                          <option value="">Select Specialization</option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="General Practice">General Practice</option>
                          <option value="Family Medicine">Family Medicine</option>
                          <option value="Internal Medicine">Internal Medicine</option>
                          <option value="Immunology">Immunology</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Years of Experience */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Years of Experience
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaIdCard className="text-gray-400" />
                        </div>
                        <input
                          type="number"
                          name="yearsOfExperience"
                          value={formData.yearsOfExperience}
                          onChange={handleChange}
                          placeholder="Years of Experience"
                          min="0"
                          max="50"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {userType === "parent" && (
                <div className="space-y-5 mb-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaPhone className="text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Phone Number"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          required
                        />
                      </div>
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaHome className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, city: e.target.value }
                          }))}
                          placeholder="Your City"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Fields */}
              {/* Email Field */}
              <div className="space-y-2 mb-5">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                      minLength="8"
                    />
                    {/* Password toggle button */}
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FaEye className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                      minLength="8"
                    />
                    {/* Confirm password toggle button */}
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FaEye className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center mb-6">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-gray-700"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Terms & Conditions
                  </Link>
                </label>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  `Creating ${userType.charAt(0).toUpperCase() + userType.slice(1)} Account...`
                ) : (
                  <>
                    Create {userType.charAt(0).toUpperCase() + userType.slice(1)} Account
                    <FaArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Already registered?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSignup;
