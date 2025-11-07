import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const TPOAnalytics = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/tpo/analytics');
            setAnalyticsData(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    // Company-wise Applications Chart Data
    const companyAppsData = {
        labels: analyticsData?.company_stats?.map(c => c.company_name) || [],
        datasets: [{
            label: 'Applications',
            data: analyticsData?.company_stats?.map(c => c.application_count) || [],
            backgroundColor: [
                'rgba(14, 165, 233, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(168, 85, 247, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(236, 72, 153, 0.8)',
            ],
        }]
    };

    // Status Distribution Pie Chart
    const statusData = {
        labels: ['Applied', 'Shortlisted', 'Selected', 'Rejected'],
        datasets: [{
            data: [
                analyticsData?.status_stats?.applied || 0,
                analyticsData?.status_stats?.shortlisted || 0,
                analyticsData?.status_stats?.selected || 0,
                analyticsData?.status_stats?.rejected || 0,
            ],
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(168, 85, 247, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(239, 68, 68, 0.8)',
            ],
        }]
    };

    // Department-wise Placement Line Chart
    const deptData = {
        labels: analyticsData?.department_stats?.map(d => d.department_name) || [],
        datasets: [{
            label: 'Students Placed',
            data: analyticsData?.department_stats?.map(d => d.placed_count) || [],
            borderColor: 'rgb(14, 165, 233)',
            backgroundColor: 'rgba(14, 165, 233, 0.2)',
            tension: 0.4,
        }]
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/tpo/dashboard')} className="text-gray-600 hover:text-gray-800">
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
                    </div>
                    <button onClick={() => { logout(); navigate('/login'); }} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                        Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Company-wise Applications */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Company-wise Applications</h3>
                        <div className="h-80">
                            <Bar data={companyAppsData} options={{ maintainAspectRatio: false, responsive: true }} />
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Application Status Distribution</h3>
                        <div className="h-80">
                            <Pie data={statusData} options={{ maintainAspectRatio: false, responsive: true }} />
                        </div>
                    </div>

                    {/* Department-wise Placements */}
                    <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Department-wise Placements</h3>
                        <div className="h-80">
                            <Line data={deptData} options={{ maintainAspectRatio: false, responsive: true }} />
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
                        <p className="text-sm opacity-90">Total Applications</p>
                        <p className="text-4xl font-bold mt-2">{analyticsData?.total_applications || 0}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white">
                        <p className="text-sm opacity-90">Students Placed</p>
                        <p className="text-4xl font-bold mt-2">{analyticsData?.total_placed || 0}</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
                        <p className="text-sm opacity-90">Active Drives</p>
                        <p className="text-4xl font-bold mt-2">{analyticsData?.active_drives || 0}</p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white">
                        <p className="text-sm opacity-90">Companies</p>
                        <p className="text-4xl font-bold mt-2">{analyticsData?.total_companies || 0}</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TPOAnalytics;
