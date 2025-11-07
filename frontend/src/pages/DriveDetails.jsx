import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const DriveDetails = () => {
    const { driveId } = useParams();
    const navigate = useNavigate();

    const [drive, setDrive] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchDriveDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/student/drives/${driveId}`, { signal: controller.signal });
                if (isMounted) {
                    setDrive(response.data.drive);
                }
            } catch (error) {
                if (isMounted) {
                    setError('Failed to load drive details');
                    toast.error('Failed to load drive details');
                }
                console.error('Error fetching drive details:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDriveDetails();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [driveId]);

    const formatPackage = (amount) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)} LPA`;
        }
        return `₹${(amount / 1000).toFixed(0)}K`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading drive details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center text-red-600">
                    <span className="text-6xl mb-4 block">❌</span>
                    <h2 className="text-2xl font-bold mb-2">Error</h2>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/student/drives')}
                        className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
                    >
                        Back to Drives
                    </button>
                </div>
            </div>
        );
    }

    if (!drive) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <span className="text-6xl mb-4 block">❌</span>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Drive Not Found</h2>
                    <button
                        onClick={() => navigate('/student/drives')}
                        className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
                    >
                        Back to Drives
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/student/drives')}
                        className="text-gray-600 hover:text-gray-800 font-semibold"
                    >
                        ← Back to Drives
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Company Header */}
                <div className="bg-white rounded-lg shadow p-8 mb-6">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-4xl">🏢</span>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-800">{drive.company_name}</h1>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                    {drive.industry}
                                </span>
                            </div>
                            <h2 className="text-xl font-semibold text-teal-600 mb-3">{drive.job_role}</h2>
                            <p className="text-gray-600 mb-4">{drive.company_description}</p>

                            {drive.company_website && (
                                <a
                                    href={drive.company_website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-teal-600 hover:text-teal-700 text-sm font-semibold"
                                >
                                    Visit Website →
                                </a>
                            )}
                        </div>

                        <div className="text-right">
                            {drive.has_applied ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-3">
                                    <p className="text-green-800 font-semibold">✅ Applied</p>
                                    <p className="text-green-600 text-sm mt-1 capitalize">
                                        Status: {drive.application_status?.replace('_', ' ')}
                                    </p>
                                    <Link
                                        to="/student/applications"
                                        className="text-teal-600 hover:text-teal-700 text-sm font-semibold mt-2 block"
                                    >
                                        View Application →
                                    </Link>
                                </div>
                            ) : (
                                <Link
                                    to={`/student/apply/${driveId}`}
                                    className="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 transition font-semibold text-lg"
                                >
                                    Apply Now
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Key Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <span className="text-3xl mb-2 block">💰</span>
                        <p className="text-gray-600 text-sm mb-1">Package (CTC)</p>
                        <p className="text-2xl font-bold text-gray-800">{formatPackage(drive.package_ctc)}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <span className="text-3xl mb-2 block">📍</span>
                        <p className="text-gray-600 text-sm mb-1">Location</p>
                        <p className="text-lg font-semibold text-gray-800">{drive.location}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <span className="text-3xl mb-2 block">📊</span>
                        <p className="text-gray-600 text-sm mb-1">Total Rounds</p>
                        <p className="text-2xl font-bold text-gray-800">{drive.rounds?.length || 0}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <span className="text-3xl mb-2 block">👥</span>
                        <p className="text-gray-600 text-sm mb-1">Applications</p>
                        <p className="text-2xl font-bold text-gray-800">{drive.total_applications}</p>
                    </div>
                </div>

                {/* Job Description */}
                <div className="bg-white rounded-lg shadow p-8 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Job Description</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{drive.job_description}</p>
                </div>

                {/* Eligibility Criteria */}
                <div className="bg-white rounded-lg shadow p-8 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Eligibility Criteria</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <span className="text-2xl">🎓</span>
                            <div>
                                <p className="text-gray-600 text-sm">Minimum CGPA</p>
                                <p className="text-lg font-semibold text-gray-800">{drive.min_cgpa}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <span className="text-2xl">📚</span>
                            <div>
                                <p className="text-gray-600 text-sm">Maximum Backlogs</p>
                                <p className="text-lg font-semibold text-gray-800">{drive.max_backlogs}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <span className="text-2xl">💼</span>
                            <div>
                                <p className="text-gray-600 text-sm">Job Type</p>
                                <p className="text-lg font-semibold text-gray-800 capitalize">{drive.job_type.replace('-', ' ')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <span className="text-2xl">📅</span>
                            <div>
                                <p className="text-gray-600 text-sm">Deadline</p>
                                <p className="text-lg font-semibold text-gray-800">{formatDate(drive.application_deadline)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recruitment Rounds */}
                <div className="bg-white rounded-lg shadow p-8 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Recruitment Process</h3>
                    <div className="space-y-3">
                        {drive.rounds?.map((round, index) => (
                            <div key={round.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    {round.round_number}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">{round.round_name}</h4>
                                    <p className="text-gray-600 text-sm capitalize">{round.round_type}</p>
                                </div>
                                {round.round_date && (
                                    <div className="text-right text-sm text-gray-600">
                                        {formatDate(round.round_date)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Package Details (if available) */}
                {(drive.package_base || drive.package_stipend) && (
                    <div className="bg-white rounded-lg shadow p-8 mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Package Breakdown</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {drive.package_base && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-blue-600 text-sm mb-1">Base Salary</p>
                                    <p className="text-2xl font-bold text-blue-800">{formatPackage(drive.package_base)}</p>
                                </div>
                            )}
                            {drive.package_stipend && (
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <p className="text-purple-600 text-sm mb-1">Stipend (if internship)</p>
                                    <p className="text-2xl font-bold text-purple-800">{formatPackage(drive.package_stipend)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Apply Button (Bottom) */}
                {!drive.has_applied ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <Link
                            to={`/student/apply/${driveId}`}
                            className="inline-block bg-teal-600 text-white px-12 py-4 rounded-lg hover:bg-teal-700 transition font-semibold text-lg"
                        >
                            Apply to This Drive
                        </Link>
                        <p className="text-gray-600 text-sm mt-3">
                            Deadline: {formatDate(drive.application_deadline)}
                        </p>
                    </div>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <span className="text-4xl">✅</span>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-green-800">Application Submitted</h3>
                                <p className="text-green-700 capitalize">
                                    Current Status: {drive.application_status?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/student/applications"
                            className="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 transition font-semibold mt-4"
                        >
                            Track Your Application →
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DriveDetails;
