import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const TPODrives = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchDrives();
    }, [filter]);

    const fetchDrives = async () => {
        try {
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const response = await api.get(`/tpo/drives${params}`);
            setDrives(response.data.drives);
        } catch (error) {
            console.error('Error fetching drives:', error);
            toast.error('Failed to load drives');
        } finally {
            setLoading(false);
        }
    };

    const formatPackage = (amount) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)} LPA`;
        }
        return `₹${(amount / 1000).toFixed(0)}K`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'active': 'bg-green-100 text-green-800 border-green-200',
            'completed': 'bg-blue-100 text-blue-800 border-blue-200',
            'cancelled': 'bg-red-100 text-red-800 border-red-200',
            'draft': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const handleDelete = async (driveId) => {
        if (!window.confirm('Are you sure you want to delete this drive?')) {
            return;
        }

        try {
            await api.delete(`/tpo/drives/${driveId}`);
            toast.success('Drive deleted successfully!');
            fetchDrives();
        } catch (error) {
            console.error('Error deleting drive:', error);
            const errorMsg = error.response?.data?.error || 'Failed to delete drive';
            toast.error(errorMsg);
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
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/tpo/dashboard')}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Placement Drives</h1>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            to="/tpo/drives/create"
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                        >
                            + Create Drive
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white border-b sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${filter === 'all'
                                ? 'bg-teal-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All ({drives.length})
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${filter === 'active'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${filter === 'completed'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Completed
                        </button>
                        <button
                            onClick={() => setFilter('cancelled')}
                            className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${filter === 'cancelled'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Cancelled
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading drives...</p>
                    </div>
                ) : drives.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-6xl mb-4 block">🚀</span>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Drives Found</h3>
                        <p className="text-gray-600 mb-6">
                            {filter === 'all'
                                ? 'Create your first placement drive to get started.'
                                : `No ${filter} drives at the moment.`}
                        </p>
                        {filter === 'all' && (
                            <Link
                                to="/tpo/drives/create"
                                className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition font-semibold"
                            >
                                + Create Drive
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {drives.map((drive) => (
                            <div
                                key={drive.id}
                                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4 flex-1">
                                        {/* Company Logo */}
                                        <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-2xl">🏢</span>
                                        </div>

                                        {/* Drive Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-800">
                                                    {drive.company_name}
                                                </h3>
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                    {drive.industry}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(drive.status)}`}>
                                                    {drive.status.toUpperCase()}
                                                </span>
                                            </div>

                                            <h4 className="text-lg font-semibold text-teal-600 mb-3">
                                                {drive.job_role}
                                            </h4>

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <span>💰</span>
                                                    <span className="font-semibold">{formatPackage(drive.package_ctc)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span>📍</span>
                                                    <span>{drive.location}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span>📅</span>
                                                    <span>Deadline: {formatDate(drive.application_deadline)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span>📝</span>
                                                    <span>{drive.application_count} Applications</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span>🎉</span>
                                                    <span>{drive.selected_count} Selected</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 ml-4">
                                        <Link
                                            to={`/tpo/drives/${drive.id}`}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center text-sm font-semibold whitespace-nowrap"
                                        >
                                            View Details
                                        </Link>
                                        <Link
                                            to={`/tpo/applications?drive_id=${drive.id}`}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-center text-sm font-semibold whitespace-nowrap"
                                        >
                                            Applications
                                        </Link>
                                        <Link
                                            to={`/tpo/drives/${drive.id}/rounds`}
                                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-center text-sm font-semibold whitespace-nowrap"
                                        >
                                            Manage Rounds
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(drive.id)}
                                            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition text-sm font-semibold"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TPODrives;
