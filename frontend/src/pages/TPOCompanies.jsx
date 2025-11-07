import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const TPOCompanies = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        website: '',
        industry: '',
        location: ''
    });

    useEffect(() => {
        fetchCompanies();
    }, [search]);

    const fetchCompanies = async () => {
        try {
            const params = search ? `?search=${search}` : '';
            const response = await api.get(`/tpo/companies${params}`);
            setCompanies(response.data.companies);
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('Failed to load companies');
        } finally {
            setLoading(false);
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

        try {
            if (editingCompany) {
                await api.put(`/tpo/companies/${editingCompany.id}`, formData);
                toast.success('Company updated successfully!');
            } else {
                await api.post('/tpo/companies', formData);
                toast.success('Company created successfully!');
            }

            setShowModal(false);
            setEditingCompany(null);
            setFormData({
                name: '',
                description: '',
                website: '',
                industry: '',
                location: ''
            });
            fetchCompanies();

        } catch (error) {
            console.error('Error saving company:', error);
            const errorMsg = error.response?.data?.error || 'Failed to save company';
            toast.error(errorMsg);
        }
    };

    const handleEdit = (company) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            description: company.description || '',
            website: company.website || '',
            industry: company.industry,
            location: company.location
        });
        setShowModal(true);
    };

    const handleDelete = async (companyId) => {
        if (!window.confirm('Are you sure you want to delete this company?')) {
            return;
        }

        try {
            await api.delete(`/tpo/companies/${companyId}`);
            toast.success('Company deleted successfully!');
            fetchCompanies();
        } catch (error) {
            console.error('Error deleting company:', error);
            const errorMsg = error.response?.data?.error || 'Failed to delete company';
            toast.error(errorMsg);
        }
    };

    const openCreateModal = () => {
        setEditingCompany(null);
        setFormData({
            name: '',
            description: '',
            website: '',
            industry: '',
            location: ''
        });
        setShowModal(true);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/tpo/dashboard')}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Manage Companies</h1>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={openCreateModal}
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                        >
                            + Add Company
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Search */}
            <div className="bg-white border-b sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Banner */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold">{companies.length}</h2>
                            <p className="text-blue-50">Total Companies</p>
                        </div>
                        <span className="text-6xl">🏢</span>
                    </div>
                </div>

                {/* Companies Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading companies...</p>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-6xl mb-4 block">🏢</span>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Companies Yet</h3>
                        <p className="text-gray-600 mb-6">Start by adding your first company.</p>
                        <button
                            onClick={openCreateModal}
                            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition font-semibold"
                        >
                            + Add Company
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((company) => (
                            <div
                                key={company.id}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
                            >
                                {/* Company Icon */}
                                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                    <span className="text-3xl">🏢</span>
                                </div>

                                {/* Company Info */}
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{company.name}</h3>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span>🏭</span>
                                        <span>{company.industry}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>📍</span>
                                        <span>{company.location}</span>
                                    </div>
                                    {company.website && (
                                        <div className="flex items-center gap-2">
                                            <span>🌐</span>
                                            <a
                                                href={company.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-teal-600 hover:text-teal-700 truncate"
                                            >
                                                {company.website}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex gap-4 mb-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <span>🚀</span>
                                        <span className="font-semibold">{company.total_drives || 0}</span>
                                        <span className="text-gray-600">Drives</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>📝</span>
                                        <span className="font-semibold">{company.total_applications || 0}</span>
                                        <span className="text-gray-600">Apps</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Link
                                        to={`/tpo/companies/${company.id}`}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center text-sm font-semibold"
                                    >
                                        View Details
                                    </Link>
                                    <button
                                        onClick={() => handleEdit(company)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(company.id)}
                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                {editingCompany ? 'Edit Company' : 'Add New Company'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                        placeholder="e.g., Google"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Industry *
                                    </label>
                                    <input
                                        type="text"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                        placeholder="e.g., Technology"
                                    />
                                </div>

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
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                        placeholder="Brief description about the company..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition font-semibold"
                                    >
                                        {editingCompany ? 'Update Company' : 'Create Company'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TPOCompanies;
