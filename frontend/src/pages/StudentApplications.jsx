import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const StudentApplications = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchApplications = async () => {
            try {
                if (isMounted) {
                    setLoading(true);
                    setError(null);
                }
                const response = await api.get('/student/applications', {
                    signal: controller.signal
                });
                if (isMounted) {
                    setApplications(response.data.applications);
                }
            } catch (error) {
                if (isMounted) {
                    setError('Failed to load applications');
                    toast.error('Failed to load applications');
                }
                console.error('Error fetching applications:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchApplications();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

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
            'applied': 'bg-blue-100 text-blue-800 border-blue-200',
            'shortlisted': 'bg-purple-100 text-purple-800 border-purple-200',
            'selected': 'bg-green-100 text-green-800 border-green-200',
            'rejected': 'bg-red-100 text-red-800 border-red-200',
            'on_hold': 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'applied': '📝',
            'shortlisted': '⭐',
            'selected': '🎉',
            'rejected': '❌',
            'on_hold': '⏳'
        };
        return icons[status] || '📄';
    };

    const filteredApplications = filter === 'all'
        ? applications
        : applications.filter(app => app.status === filter);

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
                            onClick={() => navigate('/student/dashboard')}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">My Applications</h1>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            to="/student/drives"
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                        >
                            Browse Drives
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
                        {['all', 'applied', 'shortlisted', 'selected', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${filter === status
                                        ? `bg-teal-600 text-white`
                                        : `bg-gray-100 text-gray-700 hover:bg-gray-200`
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)} ({applications.filter(a => (status === 'all' ? true : a.status === status)).length})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading applications...</p>
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-6xl mb-4 block">📭</span>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {filter === 'all' ? 'No Applications Yet' : `No ${filter} Applications`}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {filter === 'all'
                                ? "Start applying to placement drives to see them here."
                                : `You don't have any ${filter} applications.`}
                        </p>
                        {filter === 'all' && (
                            <Link
                                to="/student/drives"
                                className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition font-semibold"
                            >
                                Browse Placement Drives
                            </Link>
                        )}
                    </div>
                ) : (
                    filteredApplications.map((application) => (
                        <div
                            key={application.id}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 mb-6"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4 flex-1">
                                    {/* Company Logo */}
                                    <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">🏢</span>
                                    </div>

                                    {/* Application Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {application.company_name}
                                            </h3>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                {application.industry}
                                            </span>
                                        </div>

                                        <h4 className="text-lg font-semibold text-teal-600 mb-3">
                                            {application.job_role}
                                        </h4>

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <span>💰</span>
                                                <span className="font-semibold">{formatPackage(application.package_ctc)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span>📍</span>
                                                <span>{application.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span>📅</span>
                                                <span>Applied: {formatDate(application.applied_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span>💼</span>
                                                <span className="capitalize">{application.job_type.replace('-', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex flex-col items-end gap-3 ml-4">
                                    <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(application.status)}`}>
                                        {getStatusIcon(application.status)} {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('_', ' ')}
                                    </span>

                                    <Link to={`/student/applications/${application.id}`} className="text-teal-600 hover:text-teal-700 font-semibold text-sm">
                                        View Details →
                                    </Link>
                                </div>
                            </div>

                            {/* Current Round */}
                            {application.current_round > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">Current Round:</span> Round {application.current_round}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};

export default StudentApplications;
