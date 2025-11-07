import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const HODDashboard = () => {
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
                const response = await api.get('/hod/stats', { signal: controller.signal });
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
                if (isMounted) setLoading(false);
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
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">HOD Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-2">Welcome, {user?.first_name}! 🎓</h2>
                    <p className="text-gray-600">{user?.department_name} Department</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Students</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.total_students || 0}</p>
                                </div>
                                <span className="text-4xl">👨‍🎓</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-gray-600 text-sm">Pending Approval</p>
                                    <p className="text-3xl font-bold text-yellow-600 mt-2">{stats?.pending_students || 0}</p>
                                </div>
                                <span className="text-4xl">⏳</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-gray-600 text-sm">Approved</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">{stats?.approved_students || 0}</p>
                                </div>
                                <span className="text-4xl">✅</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-gray-600 text-sm">Students Placed</p>
                                    <p className="text-3xl font-bold text-teal-600 mt-2">{stats?.placed_students || 0}</p>
                                </div>
                                <span className="text-4xl">🎉</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/hod/students" className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white hover:from-blue-600 hover:to-indigo-700 transition">
                        <h3 className="text-xl font-semibold mb-2">👨‍🎓 Manage Students</h3>
                        <p className="text-blue-50">Approve and manage student profiles</p>
                        <div className="mt-4 text-2xl font-bold">{stats?.pending_students || 0} Pending</div>
                    </Link>

                    <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg p-6 text-white">
                        <h3 className="text-xl font-semibold mb-2">📊 Department Stats</h3>
                        <p className="text-teal-50">View placement analytics</p>
                        <div className="mt-4 text-2xl font-bold">{stats?.total_applications || 0} Applications</div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HODDashboard;
