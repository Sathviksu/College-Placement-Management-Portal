import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
    const [backendStatus, setBackendStatus] = useState('checking...');
    const [dbStatus, setDbStatus] = useState('checking...');

    useEffect(() => {
        // Test backend connection
        const testBackend = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/health');
                if (response.data.status === 'success') {
                    setBackendStatus('✅ Connected');
                    setDbStatus(response.data.database === 'connected' ? '✅ Connected' : '❌ Not Connected');
                }
            } catch (error) {
                setBackendStatus('❌ Not Connected');
                setDbStatus('❌ Unknown');
                console.error('Backend connection error:', error);
            }
        };

        testBackend();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-teal-100 to-cyan-100 flex items-center justify-center p-4">
            <div className="text-center max-w-4xl">
                {/* Logo/Icon */}
                <div className="mb-6">
                    <div className="text-6xl mb-4 animate-bounce">🎓</div>
                </div>

                {/* Main Heading */}
                <h1 className="text-6xl font-bold text-teal-700 mb-4 tracking-tight">
                    Placement Portal
                </h1>

                {/* Subheading */}
                <p className="text-2xl text-gray-700 mb-8 font-light">
                    College Placement Management System
                </p>

                {/* Description */}
                <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
                    Streamline your campus recruitment process with our comprehensive placement management solution.
                    Connect students, companies, and administrators seamlessly.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center mb-12">
                    <Link
                        to="/login"
                        className="bg-teal-600 text-white px-8 py-4 rounded-lg hover:bg-teal-700 transition transform hover:scale-105 shadow-lg font-semibold"
                    >
                        Login →
                    </Link>
                    <Link
                        to="/register"
                        className="bg-white text-teal-600 px-8 py-4 rounded-lg border-2 border-teal-600 hover:bg-teal-50 transition shadow-lg font-semibold"
                    >
                        Register
                    </Link>
                </div>

                {/* Status Badges */}
                {/* <div className="flex flex-wrap gap-3 justify-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-5 py-2 rounded-full text-sm font-semibold shadow">
                        <span>Backend:</span>
                        <span>{backendStatus}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-5 py-2 rounded-full text-sm font-semibold shadow">
                        <span>Database:</span>
                        <span>{dbStatus}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-5 py-2 rounded-full text-sm font-semibold shadow">
                        ✅ Frontend Running
                    </div>
                </div> */}

                {/* Ready Badge */}
                {/* <div className="mb-10">
                    <span className="inline-block bg-blue-500 text-white px-6 py-3 rounded-full text-base font-bold shadow-lg animate-pulse">
                        🚀 Phase 1 Complete - Authentication Ready!
                    </span>
                </div> */}



                {/* Quick Links */}
                <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <Link
                        to="/login"
                        className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition"
                    >
                        <div className="text-3xl mb-2">👨‍🎓</div>
                        <div className="text-sm font-semibold text-gray-700">Student Login</div>
                    </Link>
                    <Link
                        to="/login"
                        className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition"
                    >
                        <div className="text-3xl mb-2">👨‍🏫</div>
                        <div className="text-sm font-semibold text-gray-700">HOD Login</div>
                    </Link>
                    <Link
                        to="/login"
                        className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition"
                    >
                        <div className="text-3xl mb-2">👔</div>
                        <div className="text-sm font-semibold text-gray-700">TPO Login</div>
                    </Link>
                </div>

                {/* Footer */}
                <div className="mt-10 text-sm text-gray-500">
                    <p>&copy; 2025 All Rights Reserved.</p>
                    <p className="mt-2">Made with ❤️ by HackStronauts </p>
                </div>
            </div>
        </div>
    );
};

export default Home;
