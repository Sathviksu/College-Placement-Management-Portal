import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const HODStudents = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('pending');
    const [search, setSearch] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchStudents = async () => {
            try {
                setLoading(true);
                setError(null);
                const params = new URLSearchParams();
                if (filter !== 'all') params.append('status', filter);
                if (search) params.append('search', search);

                const response = await api.get(`/hod/students?${params.toString()}`, {
                    signal: controller.signal
                });

                if (isMounted) {
                    setStudents(response.data.students);
                }
            } catch (error) {
                if (isMounted) {
                    setError('Failed to load students');
                    toast.error('Failed to load students');
                }
                console.error('Error fetching students:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStudents();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [filter, search]);

    const handleApprove = async (studentId) => {
        try {
            await api.post(`/hod/students/${studentId}/approve`);
            toast.success('Student approved!');
            fetchStudents();
            setSelectedStudents(prev => prev.filter(id => id !== studentId));
        } catch (error) {
            console.error('Error approving student:', error);
            toast.error('Failed to approve student');
        }
    };

    const handleReject = async (studentId) => {
        const reason = prompt('Reason for rejection (optional):');

        try {
            await api.post(`/hod/students/${studentId}/reject`, { reason });
            toast.success('Student profile needs update');
            fetchStudents();
            setSelectedStudents(prev => prev.filter(id => id !== studentId));
        } catch (error) {
            console.error('Error rejecting student:', error);
            toast.error('Failed to reject student');
        }
    };

    const handleBulkApprove = async () => {
        if (selectedStudents.length === 0) {
            toast.error('Please select students first');
            return;
        }

        if (!window.confirm(`Approve ${selectedStudents.length} students?`)) {
            return;
        }

        try {
            await api.post('/hod/students/bulk-approve', {
                student_ids: selectedStudents
            });
            toast.success(`${selectedStudents.length} students approved!`);
            setSelectedStudents([]);
            fetchStudents();
        } catch (error) {
            console.error('Error bulk approving:', error);
            toast.error('Failed to approve students');
        }
    };

    const toggleSelect = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/hod/dashboard')} className="text-gray-600 hover:text-gray-800">
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Student Management</h1>
                    </div>
                    <button onClick={() => { logout(); navigate('/login'); }} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                        Logout
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white border-b sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}
                        >
                            All ({students.length})
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setFilter('approved')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
                        >
                            Approved
                        </button>
                    </div>

                    {selectedStudents.length > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                            <span className="font-semibold">{selectedStudents.length} selected</span>
                            <button
                                onClick={handleBulkApprove}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                Approve Selected
                            </button>
                            <button onClick={() => setSelectedStudents([])} className="bg-gray-300 px-4 py-2 rounded-lg">
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <span className="text-6xl mb-4 block">👨‍🎓</span>
                        <h3 className="text-xl font-semibold">No Students Found</h3>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input type="checkbox" checked={selectedStudents.length === students.length} onChange={toggleSelectAll} />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">CGPA</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Applications</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleSelect(student.id)} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold">{student.first_name} {student.last_name}</p>
                                                <p className="text-sm text-gray-600">{student.enrollment_number}</p>
                                                <p className="text-sm text-gray-600">{student.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold">{student.cgpa || 'N/A'}</td>
                                        <td className="px-6 py-4">{student.application_count || 0}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${student.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {student.is_approved ? 'Approved' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {!student.is_approved ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApprove(student.id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
                                                        Approve
                                                    </button>
                                                    <button onClick={() => handleReject(student.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm">
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-green-600 font-semibold">✓ Approved</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HODStudents;
