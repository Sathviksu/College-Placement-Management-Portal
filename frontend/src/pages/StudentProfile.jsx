import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const StudentProfile = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        cgpa: '',
        year_of_study: '',
        backlogs: '',
        skills: '',
        bio: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/student/profile');
            const profileData = response.data.profile;
            setProfile(profileData);

            // Populate form
            setFormData({
                first_name: profileData.first_name || '',
                last_name: profileData.last_name || '',
                phone: profileData.phone || '',
                date_of_birth: profileData.date_of_birth || '',
                gender: profileData.gender || '',
                cgpa: profileData.cgpa || '',
                year_of_study: profileData.year_of_study || '',
                backlogs: profileData.backlogs || 0,
                skills: profileData.skills || '',
                bio: profileData.bio || ''
            });

        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.put('/student/profile', formData);
            toast.success('Profile updated successfully!');
            setEditing(false);
            fetchProfile();

            // Update user in context
            updateUser({
                ...user,
                first_name: formData.first_name,
                last_name: formData.last_name
            });

        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only PDF, DOC, DOCX files are allowed');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('resume', file);

            await api.post('/student/resume', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Resume uploaded successfully!');
            fetchProfile();

        } catch (error) {
            console.error('Error uploading resume:', error);
            toast.error('Failed to upload resume');
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/student/dashboard')}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Profile Status Banner */}
                <div className={`mb-6 p-4 rounded-lg ${profile?.is_approved
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                    <p className={`font-semibold ${profile?.is_approved ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                        {profile?.is_approved
                            ? '✅ Your profile is approved. You can apply to placement drives.'
                            : '⏳ Your profile is pending approval from HOD.'}
                    </p>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Personal Information</h2>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        CGPA
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="cgpa"
                                        value={formData.cgpa}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Year
                                    </label>
                                    <select
                                        name="year_of_study"
                                        value={formData.year_of_study}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="">Select</option>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Skills (comma separated)
                                </label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    placeholder="Python, JavaScript, React, Node.js"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Tell us about yourself..."
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Name:</span>
                                    <span className="ml-2 font-semibold">{profile?.first_name} {profile?.last_name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Email:</span>
                                    <span className="ml-2 font-semibold">{profile?.email}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Enrollment:</span>
                                    <span className="ml-2 font-semibold">{profile?.enrollment_number}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Department:</span>
                                    <span className="ml-2 font-semibold">{profile?.department_name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="ml-2 font-semibold">{profile?.phone || 'Not provided'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">CGPA:</span>
                                    <span className="ml-2 font-semibold">{profile?.cgpa || 'Not provided'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Year:</span>
                                    <span className="ml-2 font-semibold">{profile?.year_of_study ? `${profile.year_of_study}${profile.year_of_study === 1 ? 'st' : profile.year_of_study === 2 ? 'nd' : profile.year_of_study === 3 ? 'rd' : 'th'} Year` : 'Not provided'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Gender:</span>
                                    <span className="ml-2 font-semibold capitalize">{profile?.gender || 'Not provided'}</span>
                                </div>
                            </div>

                            {profile?.skills && (
                                <div>
                                    <span className="text-gray-600 text-sm">Skills:</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {profile.skills.split(',').map((skill, index) => (
                                            <span key={index} className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {profile?.bio && (
                                <div>
                                    <span className="text-gray-600 text-sm">Bio:</span>
                                    <p className="mt-2 text-gray-700">{profile.bio}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Resume Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Resume</h2>

                    {profile?.resume_url ? (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">📄</span>
                                <div>
                                    <p className="font-semibold text-gray-800">Resume Uploaded</p>
                                    <p className="text-sm text-gray-600">{profile.resume_url.split('/').pop()}</p>
                                </div>
                            </div>
                            <label className="cursor-pointer bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
                                {uploading ? 'Uploading...' : 'Replace'}
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleResumeUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <span className="text-5xl mb-4 block">📤</span>
                            <p className="text-gray-600 mb-4">Upload your resume (PDF, DOC, DOCX)</p>
                            <label className="cursor-pointer bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition inline-block">
                                {uploading ? 'Uploading...' : 'Choose File'}
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleResumeUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-2">Max file size: 5MB</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentProfile;
