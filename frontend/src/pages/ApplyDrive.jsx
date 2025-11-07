import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const ApplyDrive = () => {
    const { driveId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [drive, setDrive] = useState(null);
    const [eligibility, setEligibility] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch drive details
                const driveResponse = await api.get(`/student/drives/${driveId}`, {
                    signal: controller.signal,
                });

                // Check eligibility
                const eligibilityResponse = await api.get(`/student/check-eligibility/${driveId}`, {
                    signal: controller.signal,
                });

                if (isMounted) {
                    setDrive(driveResponse.data.drive);
                    setEligibility(eligibilityResponse.data);
                }
            } catch (error) {
                if (isMounted) {
                    setError('Failed to load application details');
                    toast.error('Failed to load application details');
                }
                console.error('Error fetching data:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [driveId]);

    const handleApply = async () => {
        if (!confirmed) {
            toast.error('Please confirm that you meet all requirements');
            return;
        }

        setApplying(true);

        try {
            await api.post(`/student/apply/${driveId}`);
            toast.success('Application submitted successfully!');

            // Redirect to applications page after 1.5 seconds
            setTimeout(() => {
                navigate('/student/applications');
            }, 1500);

        } catch (error) {
            console.error('Error applying:', error);
            const errorMsg = error.response?.data?.error || 'Failed to submit application';
            const details = error.response?.data?.details;

            if (details && Array.isArray(details)) {
                toast.error(
                    <div>
                        <p className="font-semibold">{errorMsg}</p>
                        <ul className="mt-2 text-sm">
                            {details.map((detail, index) => (
                                <li key={index}>• {detail}</li>
                            ))}
                        </ul>
                    </div>,
                    { duration: 6000 }
                );
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setApplying(false);
        }
    };

    const formatPackage = (amount) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)} LPA`;
        }
        return `₹${(amount / 1000).toFixed(0)}K`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading application details...</p>
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
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <button
                        onClick={() => navigate(`/student/drives/${driveId}`)}
                        className="text-gray-600 hover:text-gray-800 font-semibold"
                    >
                        ← Back to Drive Details
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Application Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Apply to Drive</h1>
                    <p className="text-gray-600">Review your details and submit your application</p>
                </div>

                {/* Drive Summary Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center">
                            <span className="text-3xl">🏢</span>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-800">{drive.company_name}</h2>
                            <p className="text-lg text-teal-600 font-semibold">{drive.job_role}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Package</p>
                            <p className="text-2xl font-bold text-gray-800">{formatPackage(drive.package_ctc)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm pt-4 border-t">
                        <div>
                            <span className="text-gray-600">Location:</span>
                            <span className="ml-2 font-semibold">{drive.location}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Type:</span>
                            <span className="ml-2 font-semibold capitalize">{drive.job_type.replace('-', ' ')}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Rounds:</span>
                            <span className="ml-2 font-semibold">{drive.rounds?.length || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Eligibility Check */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Eligibility Check</h3>

                    {eligibility?.eligible ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <span className="text-6xl mb-3 block">✅</span>
                            <h4 className="text-xl font-bold text-green-800 mb-2">You are eligible!</h4>
                            <p className="text-green-700">You meet all the requirements for this drive.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-3xl">⚠️</span>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-red-800 mb-2">Not Eligible</h4>
                                        <p className="text-red-700 mb-3">Please resolve the following issues:</p>
                                        <ul className="space-y-2">
                                            {eligibility?.issues.map((issue, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${issue.type === 'critical'
                                                            ? 'bg-red-200 text-red-800'
                                                            : issue.type === 'eligibility'
                                                                ? 'bg-orange-200 text-orange-800'
                                                                : 'bg-yellow-200 text-yellow-800'
                                                        }`}>
                                                        {issue.type}
                                                    </span>
                                                    <span className="text-red-700">{issue.message}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/student/profile')}
                                    className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition font-semibold"
                                >
                                    Update Profile
                                </button>
                                <button
                                    onClick={() => navigate('/student/drives')}
                                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
                                >
                                    Browse Other Drives
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Your Profile Summary */}
                {eligibility?.eligible && (
                    <>
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Profile</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span className="text-gray-600">Name:</span>
                                    <span className="font-semibold">{user?.first_name} {user?.last_name}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span className="text-gray-600">Enrollment:</span>
                                    <span className="font-semibold">{user?.enrollment_number}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span className="text-gray-600">Department:</span>
                                    <span className="font-semibold">{user?.department_name}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span className="text-gray-600">CGPA:</span>
                                    <span className="font-semibold">{user?.cgpa || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-semibold">{user?.email}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span className="text-gray-600">Resume:</span>
                                    <span className="font-semibold text-green-600">✓ Uploaded</span>
                                </div>
                            </div>
                        </div>

                        {/* Confirmation */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmation</h3>
                            <div className="space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={confirmed}
                                        onChange={(e) => setConfirmed(e.target.checked)}
                                        className="mt-1 w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                    />
                                    <span className="text-gray-700">
                                        I confirm that all the information provided is accurate and I meet the eligibility criteria
                                        for this placement drive. I understand that providing false information may lead to
                                        disqualification.
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <button
                                onClick={handleApply}
                                disabled={!confirmed || applying}
                                className="w-full bg-teal-600 text-white px-8 py-4 rounded-lg hover:bg-teal-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {applying ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Submitting Application...
                                    </span>
                                ) : (
                                    'Submit Application'
                                )}
                            </button>

                            <p className="text-center text-gray-600 text-sm mt-4">
                                By submitting, you agree to share your profile with {drive.company_name}
                            </p>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ApplyDrive;
