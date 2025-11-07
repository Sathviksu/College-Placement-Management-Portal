import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const TPORoundManagement = () => {
    const { driveId } = useParams();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [drive, setDrive] = useState(null);
    const [rounds, setRounds] = useState([]);
    const [selectedRound, setSelectedRound] = useState(0);

    useEffect(() => {
        fetchRounds();
    }, [driveId]);

    const fetchRounds = async () => {
        try {
            const response = await api.get(`/tpo/drives/${driveId}/rounds`);
            setDrive(response.data.drive);
            setRounds(response.data.rounds);
            if (response.data.rounds.length > 0) {
                setSelectedRound(0);
            }
        } catch (error) {
            console.error('Error fetching rounds:', error);
            toast.error('Failed to load rounds');
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (applicationId) => {
        if (!window.confirm('Promote this student to the next round?')) return;

        try {
            await api.post(`/tpo/applications/${applicationId}/promote`);
            toast.success('Student promoted to next round!');
            fetchRounds();
        } catch (error) {
            console.error('Error promoting:', error);
            toast.error(error.response?.data?.error || 'Failed to promote');
        }
    };

    const handleReject = async (applicationId) => {
        const feedback = prompt('Reason for rejection (optional):');
        if (feedback === null) return; // Cancelled

        try {
            await api.post(`/tpo/applications/${applicationId}/reject-round`, { feedback });
            toast.success('Student rejected');
            fetchRounds();
        } catch (error) {
            console.error('Error rejecting:', error);
            toast.error('Failed to reject');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    const currentRound = rounds[selectedRound];
    const applications = currentRound?.applications || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/tpo/drives')} className="text-gray-600 hover:text-gray-800">
                                ← Back
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Round Management</h1>
                                <p className="text-gray-600">{drive?.company_name} - {drive?.job_role}</p>
                            </div>
                        </div>
                        <button onClick={() => { logout(); navigate('/login'); }} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                            Logout
                        </button>
                    </div>

                    {/* Round Tabs */}
                    <div className="flex gap-2 overflow-x-auto">
                        {rounds.map((round, index) => (
                            <button
                                key={round.id}
                                onClick={() => setSelectedRound(index)}
                                className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition ${selectedRound === index
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Round {round.round_number}: {round.round_name}
                                <span className="ml-2 text-sm opacity-75">
                                    ({round.applications?.length || 0})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {applications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <span className="text-6xl mb-4 block">👥</span>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Students in This Round</h3>
                        <p className="text-gray-600">Students will appear here once they reach this round.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CGPA</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {app.first_name} {app.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{app.enrollment_number}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">{app.department_name}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold">{app.cgpa || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                                    Round {app.current_round}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {app.status !== 'rejected' && app.status !== 'selected' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handlePromote(app.id)}
                                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                                                        >
                                                            ✓ Promote
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(app.id)}
                                                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {app.status === 'selected' && (
                                                    <span className="text-green-600 font-semibold">✓ Selected</span>
                                                )}
                                                {app.status === 'rejected' && (
                                                    <span className="text-red-600 font-semibold">✗ Rejected</span>
                                                )}
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

export default TPORoundManagement;
