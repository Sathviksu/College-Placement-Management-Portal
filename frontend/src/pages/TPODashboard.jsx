import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const TPODashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchStats = async () => {
            try {
                const response = await api.get('/tpo/stats', { signal: controller.signal });
                if (isMounted) {
                    setStats(response.data.stats);
                    setError(null);
                }
            } catch (error) {
                if (isMounted) {
                    setError('Failed to load statistics');
                    toast.error('Failed to load statistics');
                }
                console.error('Error fetching stats:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStats();

        return () => {
            isMounted = false;
            controller.abort();
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
                    <h1 className="text-2xl font-bold text-gray-800">TPO Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-2">Welcome, {user?.first_name}! 👔</h2>
                    <p className="text-gray-600">{user?.designation || 'Training & Placement Officer'}</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded">
                        {error}
                    </div>
                )}

                {/* Statistics Cards */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Companies</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.total_companies || 0}</p>
                                </div>
                                <span className="text-4xl">🏢</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Active Drives</p>
                                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.active_drives || 0}</p>
                                </div>
                                <span className="text-4xl">🚀</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Applications</p>
                                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats?.total_applications || 0}</p>
                                </div>
                                <span className="text-4xl">📝</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Students Placed</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">{stats?.students_placed || 0}</p>
                                </div>
                                <span className="text-4xl">🎉</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link
                        to="/tpo/companies"
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white hover:from-blue-600 hover:to-indigo-700 transition"
                    >
                        <h3 className="text-xl font-semibold mb-2">🏢 Manage Companies</h3>
                        <p className="text-blue-50">Add, edit, and manage recruiting companies</p>
                        <div className="mt-4 text-2xl font-bold">{stats?.total_companies || 0} Companies</div>
                    </Link>

                    <Link
                        to="/tpo/drives"
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg p-6 text-white hover:from-teal-600 hover:to-cyan-700 transition"
                    >
                        <h3 className="text-xl font-semibold mb-2">🚀 Placement Drives</h3>
                        <p className="text-teal-50">Create and manage placement drives</p>
                        <div className="mt-4 text-2xl font-bold">{stats?.active_drives || 0} Active</div>
                    </Link>

                    <Link
                        to="/tpo/applications"
                        className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white hover:from-purple-600 hover:to-pink-700 transition"
                    >
                        <h3 className="text-xl font-semibold mb-2">📊 Applications</h3>
                        <p className="text-purple-50">View and manage student applications</p>
                        <div className="mt-4 text-2xl font-bold">{stats?.total_applications || 0} Total</div>
                    </Link>

                    <Link
                        to="/tpo/analytics"
                        className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white hover:from-orange-600 hover:to-red-700 transition"
                    >
                        <h3 className="text-xl font-semibold mb-2">📊 Analytics Dashboard</h3>
                        <p className="text-orange-50">View charts and insights</p>
                        <div className="mt-4 text-2xl font-bold">Interactive Charts</div>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default TPODashboard;
