import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const StudentDrives = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [jobTypeFilter, setJobTypeFilter] = useState('');
    const [minPackageFilter, setMinPackageFilter] = useState('');

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchDrives = async () => {
            try {
                if (isMounted) {
                    setLoading(true);
                    setError(null);
                }

                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (jobTypeFilter) params.append('job_type', jobTypeFilter);
                if (minPackageFilter) params.append('min_package', minPackageFilter);

                const response = await api.get(`/student/drives?${params.toString()}`, {
                    signal: controller.signal
                });

                if (isMounted) {
                    setDrives(response.data.drives);
                }
            } catch (error) {
                if (isMounted) {
                    setError('Failed to load drives');
                    toast.error('Failed to load drives');
                }
                console.error('Error fetching drives:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDrives();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [search, jobTypeFilter, minPackageFilter]);

    const formatPackage = (amount) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)} LPA`;
        }
        return `₹${(amount / 1000).toFixed(0)}K`;
    };

    const getDaysRemaining = (deadline) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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
                        <button onClick={() => navigate('/student/dashboard')} className="text-gray-600 hover:text-gray-800">
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Placement Drives</h1>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/student/applications" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                            My Applications
                        </Link>
                        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white border-b sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Search by company or role..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <select
                                value={jobTypeFilter}
                                onChange={(e) => setJobTypeFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">All Job Types</option>
                                <option value="full-time">Full Time</option>
                                <option value="internship">Internship</option>
                                <option value="both">Both</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={minPackageFilter}
                                onChange={(e) => setMinPackageFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">All Packages</option>
                                <option value="500000">Above 5 LPA</option>
                                <option value="1000000">Above 10 LPA</option>
                                <option value="1500000">Above 15 LPA</option>
                                <option value="2000000">Above 20 LPA</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Banner */}
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg p-6 text-white mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold">{drives.length}</h2>
                            <p className="text-teal-50">Active Placement Drives</p>
                        </div>
                        <span className="text-6xl">🚀</span>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="text-center py-6 text-red-600 font-semibold">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading drives...</p>
                    </div>
                ) : drives.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-6xl mb-4 block">📭</span>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Drives Found</h3>
                        <p className="text-gray-600">Try adjusting your filters or check back later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {drives.map((drive) => {
                            const daysRemaining = getDaysRemaining(drive.application_deadline);
                            const isUrgent = daysRemaining <= 3;

                            return (
                                <div key={drive.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4 flex-1">
                                            {/* Company Logo Placeholder */}
                                            <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-2xl">🏢</span>
                                            </div>

                                            {/* Drive Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-800">{drive.company_name}</h3>
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{drive.industry}</span>
                                                </div>

                                                <h4 className="text-lg font-semibold text-teal-600 mb-2">{drive.job_role}</h4>

                                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{drive.job_description}</p>

                                                {/* Key Details */}
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">💰</span>
                                                        <span className="font-semibold text-gray-800">{formatPackage(drive.package_ctc)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">📍</span>
                                                        <span className="text-gray-600">{drive.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">🎓</span>
                                                        <span className="text-gray-600">Min CGPA: {drive.min_cgpa}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">📊</span>
                                                        <span className="text-gray-600">{drive.round_count} Rounds</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Section */}
                                        <div className="flex flex-col items-end gap-2 ml-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isUrgent ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Deadline today'}
                                            </span>

                                            <Link to={`/student/drives/${drive.id}`} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition font-semibold">
                                                View Details →
                                            </Link>

                                            <div className="text-xs text-gray-500 mt-2">{drive.total_applications} applications</div>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex gap-2 mt-4 pt-4 border-t">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold capitalize">
                                            {drive.job_type.replace('-', ' ')}
                                        </span>
                                        {drive.max_backlogs === 0 && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                No Backlogs
                                            </span>
                                        )}
                                        {drive.package_ctc >= 1500000 && (
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                                High Package
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentDrives;
