import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        first_name: '',
        last_name: '',
        phone: '',
        department_id: '',
        enrollment_number: '',
        designation: '',
    });
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch departments on mount
    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/auth/departments');
            setDepartments(response.data.departments);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to load departments');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if ((formData.role === 'student' || formData.role === 'hod') && !formData.department_id) {
            toast.error('Please select a department');
            return;
        }

        setLoading(true);

        try {
            // Prepare data based on role
            const registrationData = {
                email: formData.email,
                password: formData.password,
                role: formData.role,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
            };

            if (formData.role === 'student') {
                registrationData.department_id = parseInt(formData.department_id);
                registrationData.enrollment_number = formData.enrollment_number;
            } else if (formData.role === 'hod') {
                registrationData.department_id = parseInt(formData.department_id);
            } else if (formData.role === 'tpo') {
                registrationData.designation = formData.designation || 'Training & Placement Officer';
            }

            const response = await api.post('/auth/register', registrationData);

            toast.success('Registration successful! Please login.');
            setTimeout(() => navigate('/login'), 1500);

        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.error || 'Registration failed';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🎓</div>
                    <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
                    <p className="text-gray-600 mt-2">Join the placement portal</p>
                </div>

                {/* Register Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Select Your Role
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'student' })}
                                    className={`p-4 rounded-lg border-2 transition ${formData.role === 'student'
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">👨‍🎓</div>
                                    <div className="font-semibold text-sm">Student</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'hod' })}
                                    className={`p-4 rounded-lg border-2 transition ${formData.role === 'hod'
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">👨‍🏫</div>
                                    <div className="font-semibold text-sm">HOD</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'tpo' })}
                                    className={`p-4 rounded-lg border-2 transition ${formData.role === 'tpo'
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">👔</div>
                                    <div className="font-semibold text-sm">TPO</div>
                                </button>
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                placeholder="your.email@college.edu"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                placeholder="9876543210"
                            />
                        </div>

                        {/* Role-specific fields */}
                        {(formData.role === 'student' || formData.role === 'hod') && (
                            <div>
                                <label htmlFor="department_id" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Department
                                </label>
                                <select
                                    id="department_id"
                                    name="department_id"
                                    value={formData.department_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name} ({dept.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {formData.role === 'student' && (
                            <div>
                                <label htmlFor="enrollment_number" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Enrollment Number
                                </label>
                                <input
                                    type="text"
                                    id="enrollment_number"
                                    name="enrollment_number"
                                    value={formData.enrollment_number}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                    placeholder="CSE2021001"
                                />
                            </div>
                        )}

                        {formData.role === 'tpo' && (
                            <div>
                                <label htmlFor="designation" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Designation
                                </label>
                                <input
                                    type="text"
                                    id="designation"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                    placeholder="Training & Placement Officer"
                                />
                            </div>
                        )}

                        {/* Password Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                    placeholder="Min. 6 characters"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                    placeholder="Repeat password"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="mt-4 text-center">
                    <Link to="/" className="text-sm text-gray-600 hover:text-gray-800">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
