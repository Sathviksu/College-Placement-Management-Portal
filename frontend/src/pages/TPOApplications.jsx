import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const TPOApplications = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedApps, setSelectedApps] = useState([]);

    const driveIdFilter = searchParams.get('drive_id');

    useEffect(() => {
        fetchApplications();
    }, [filter, driveIdFilter, search]);

    const fetchApplications = async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('status', filter);
            if (driveIdFilter) params.append('drive_id', driveIdFilter);
            if (search) params.append('search', search);

            const response = await api.get(`/tpo/applications?${params.toString()}`);
            setApplications(response.data.applications);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load applications');
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
            'applied': 'bg-blue-100 text-blue-800',
            'shortlisted': 'bg-purple-100 text-purple-800',
            'selected': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800',
            'on_hold': 'bg-yellow-100 text-yellow-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const handleStatusUpdate = async (applicationId, newStatus) => {
        try {
            await api.put(`/tpo/applications/${applicationId}/status`, {
                status: newStatus
            });
            toast.success('Status updated successfully!');
            fetchApplications();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleBulkUpdate = async (newStatus) => {
        if (selectedApps.length === 0) {
            toast.error('Please select applications first');
            return;
        }

        if (!window.confirm(`Update ${selectedApps.length} applications to ${newStatus}?`)) {
            return;
        }

        try {
            await api.post('/tpo/applications/bulk-update', {
                application_ids: selectedApps,
                status: newStatus
            });
            toast.success(`${selectedApps.length} applications updated!`);
            setSelectedApps([]);
            fetchApplications();
        } catch (error) {
            console.error('Error bulk updating:', error);
            toast.error('Failed to update applications');
        }
    };

    const toggleSelectApp = (appId) => {
        setSelectedApps(prev =>
            prev.includes(appId)
                ? prev.filter(id => id !== appId)
                : [...prev, appId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedApps.length === applications.length) {
            setSelectedApps([]);
        } else {
            setSelectedApps(applications.map(app => app.id));
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
                        <h1 className="text-2xl font-bold text-gray-800">Applications</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Filters & Actions */}
            <div className="bg-white border-b sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search by student name or enrollment number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />

                    {/* Status Filters */}
                    <div className="flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${filter === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            All ({applications.length})
                        </button>
                        <button
                            onClick={() => setFilter('applied')}
                            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${filter === 'applied' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Applied
                        </button>
                        <button
                            onClick={() => setFilter('shortlisted')}
                            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${filter === 'shortlisted' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Shortlisted
                        </button>
                        <button
                            onClick={() => setFilter('selected')}
                            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${filter === 'selected' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Selected
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Rejected
                        </button>
                    </div>

                    {/* Bulk Actions */}
                    {selectedApps.length > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                            <span className="font-semibold text-blue-800">
                                {selectedApps.length} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBulkUpdate('shortlisted')}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-semibold"
                                >
                                    Shortlist
                                </button>
                                <button
                                    onClick={() => handleBulkUpdate('selected')}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold"
                                >
                                    Select
                                </button>
                                <button
                                    onClick={() => handleBulkUpdate('rejected')}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-semibold"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => setSelectedApps([])}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm font-semibold"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading applications...</p>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-6xl mb-4 block">📭</span>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Applications Found</h3>
                        <p className="text-gray-600">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Table Header */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedApps.length === applications.length}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Student
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Company / Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            CGPA
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Applied Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedApps.includes(app.id)}
                                                    onChange={() => toggleSelectApp(app.id)}
                                                    className="w-4 h-4"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {app.first_name} {app.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{app.enrollment_number}</p>
                                                    <p className="text-sm text-gray-600">{app.department_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{app.company_name}</p>
                                                    <p className="text-sm text-gray-600">{app.job_role}</p>
                                                    <p className="text-sm text-teal-600 font-semibold">
                                                        {formatPackage(app.package_ctc)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold">{app.cgpa || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(app.applied_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(app.status)}`}
                                                >
                                                    <option value="applied">Applied</option>
                                                    <option value="shortlisted">Shortlisted</option>
                                                    <option value="selected">Selected</option>
                                                    <option value="rejected">Rejected</option>
                                                    <option value="on_hold">On Hold</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/tpo/applications/${app.id}`)}
                                                    className="text-teal-600 hover:text-teal-700 font-semibold text-sm"
                                                >
                                                    View Details →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TPOApplications;
