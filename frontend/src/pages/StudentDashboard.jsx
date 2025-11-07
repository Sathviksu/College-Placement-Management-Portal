import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchStats = async () => {
            try {
                const response = await api.get('/student/stats');
                if (isMounted) {
                    setStats(response.data.stats);
                    setError(null);
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
                if (isMounted) setError('Failed to fetch statistics. Please try again.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStats();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Welcome back, {user?.first_name}! 👋</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Email:</span>
                            <span className="ml-2 font-semibold block mt-1">{user?.email}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Enrollment:</span>
                            <span className="ml-2 font-semibold block mt-1">{user?.enrollment_number}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Department:</span>
                            <span className="ml-2 font-semibold block mt-1">{user?.department_name}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Status:</span>
                            <span className={`ml-2 font-semibold block mt-1 ${user?.is_approved ? 'text-green-600' : 'text-yellow-600'}`}>
                                {user?.is_approved ? 'Approved ✓' : 'Pending'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 text-red-600 font-semibold text-center">
                        {error}
                    </div>
                )}

                {/* Statistics Cards */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Applications</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.total_applications || 0}</p>
                                </div>
                                <span className="text-4xl">📝</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Shortlisted</p>
                                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.shortlisted || 0}</p>
                                </div>
                                <span className="text-4xl">⭐</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Selected</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">{stats?.selected || 0}</p>
                                </div>
                                <span className="text-4xl">🎉</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Link
                        to="/student/drives"
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg p-6 text-white hover:from-teal-600 hover:to-cyan-700 transition"
                    >
                        <h3 className="text-xl font-semibold mb-2">🚀 View Placement Drives</h3>
                        <p className="text-teal-50">Browse and apply to active placement opportunities</p>
                        <div className="mt-4 text-2xl font-bold">{stats?.active_drives || 0} Active Drives</div>
                    </Link>

                    <Link
                        to="/student/applications"
                        className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white hover:from-purple-600 hover:to-pink-700 transition"
                    >
                        <h3 className="text-xl font-semibold mb-2">📊 My Applications</h3>
                        <p className="text-purple-50">Track your application status and results</p>
                        <div className="mt-4 text-2xl font-bold">{stats?.pending || 0} Pending</div>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
