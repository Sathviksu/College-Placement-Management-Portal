import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const TPOCreateDrive = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        company_id: '',
        job_role: '',
        job_description: '',
        package_ctc: '',
        package_base: '',
        package_stipend: '',
        location: '',
        job_type: 'full-time',
        min_cgpa: '',
        max_backlogs: '',
        application_deadline: '',
        total_rounds: 3
    });

    const [rounds, setRounds] = useState([
        { name: 'Aptitude Test', type: 'aptitude' },
        { name: 'Technical Interview', type: 'technical' },
        { name: 'HR Interview', type: 'hr' }
    ]);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/tpo/companies');
            setCompanies(response.data.companies);
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('Failed to load companies');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleRoundChange = (index, field, value) => {
        const newRounds = [...rounds];
        newRounds[index][field] = value;
        setRounds(newRounds);
    };

    const addRound = () => {
        setRounds([...rounds, { name: '', type: 'technical' }]);
        setFormData({ ...formData, total_rounds: rounds.length + 1 });
    };

    const removeRound = (index) => {
        const newRounds = rounds.filter((_, i) => i !== index);
        setRounds(newRounds);
        setFormData({ ...formData, total_rounds: newRounds.length });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                package_ctc: parseFloat(formData.package_ctc),
                package_base: parseFloat(formData.package_base || formData.package_ctc),
                package_stipend: parseFloat(formData.package_stipend || 0),
                min_cgpa: parseFloat(formData.min_cgpa),
                max_backlogs: parseInt(formData.max_backlogs),
                rounds: rounds.filter(r => r.name) // Only include rounds with names
            };

            await api.post('/tpo/drives', payload);
            toast.success('Drive created successfully!');
            navigate('/tpo/drives');

        } catch (error) {
            console.error('Error creating drive:', error);
            const errorMsg = error.response?.data?.error || 'Failed to create drive';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/tpo/drives')}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Create Placement Drive</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Company Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Company *
                            </label>
                            <select
                                name="company_id"
                                value={formData.company_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Select a company</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name} - {company.industry}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Job Role */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Job Role *
                            </label>
                            <input
                                type="text"
                                name="job_role"
                                value={formData.job_role}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g., Software Engineer"
                            />
                        </div>

                        {/* Job Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Job Description *
                            </label>
                            <textarea
                                name="job_description"
                                value={formData.job_description}
                                onChange={handleChange}
                                required
                                rows="4"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                placeholder="Describe the role, responsibilities, and requirements..."
                            />
                        </div>

                        {/* Package Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Package CTC (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="package_ctc"
                                    value={formData.package_ctc}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="1000"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g., 1200000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Base Salary (₹)
                                </label>
                                <input
                                    type="number"
                                    name="package_base"
                                    value={formData.package_base}
                                    onChange={handleChange}
                                    min="0"
                                    step="1000"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g., 1000000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Stipend (₹/month)
                                </label>
                                <input
                                    type="number"
                                    name="package_stipend"
                                    value={formData.package_stipend}
                                    onChange={handleChange}
                                    min="0"
                                    step="1000"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g., 50000"
                                />
                            </div>
                        </div>

                        {/* Location and Job Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Location *
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g., Bangalore, India"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Job Type *
                                </label>
                                <select
                                    name="job_type"
                                    value={formData.job_type}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="full-time">Full Time</option>
                                    <option value="internship">Internship</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                        </div>

                        {/* Eligibility Criteria */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Minimum CGPA *
                                </label>
                                <input
                                    type="number"
                                    name="min_cgpa"
                                    value={formData.min_cgpa}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g., 7.0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Maximum Backlogs *
                                </label>
                                <input
                                    type="number"
                                    name="max_backlogs"
                                    value={formData.max_backlogs}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g., 0"
                                />
                            </div>
                        </div>

                        {/* Application Deadline */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Application Deadline *
                            </label>
                            <input
                                type="datetime-local"
                                name="application_deadline"
                                value={formData.application_deadline}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                        </div>

                        {/* Recruitment Rounds */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-semibold text-gray-700">
                                    Recruitment Rounds ({rounds.length})
                                </label>
                                <button
                                    type="button"
                                    onClick={addRound}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                >
                                    + Add Round
                                </button>
                            </div>

                            <div className="space-y-3">
                                {rounds.map((round, index) => (
                                    <div key={index} className="flex gap-3 items-center p-4 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <input
                                            type="text"
                                            value={round.name}
                                            onChange={(e) => handleRoundChange(index, 'name', e.target.value)}
                                            placeholder="Round name"
                                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                        />
                                        <select
                                            value={round.type}
                                            onChange={(e) => handleRoundChange(index, 'type', e.target.value)}
                                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="aptitude">Aptitude</option>
                                            <option value="technical">Technical</option>
                                            <option value="coding">Coding</option>
                                            <option value="hr">HR</option>
                                        </select>
                                        {rounds.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRound(index)}
                                                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition font-semibold disabled:opacity-50"
                            >
                                {loading ? 'Creating Drive...' : 'Create Drive'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/tpo/drives')}
                                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default TPOCreateDrive;
