import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const StudentNotifications = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/student/notifications');
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/student/notifications/read-all');
            toast.success('All notifications marked as read');
            fetchNotifications();
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getIcon = (type) => {
        const icons = {
            'success': '🎉',
            'info': 'ℹ️',
            'warning': '⚠️',
            'error': '❌'
        };
        return icons[type] || '📢';
    };

    const filteredNotifications = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter(n => !n.is_read)
            : notifications.filter(n => n.is_read);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/student/dashboard')} className="text-gray-600 hover:text-gray-800">
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                    </div>
                    <button onClick={() => { logout(); navigate('/login'); }} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}>
                            All ({notifications.length})
                        </button>
                        <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg font-semibold ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                            Unread ({notifications.filter(n => !n.is_read).length})
                        </button>
                        <button onClick={() => setFilter('read')} className={`px-4 py-2 rounded-lg font-semibold ${filter === 'read' ? 'bg-gray-600 text-white' : 'bg-gray-100'}`}>
                            Read ({notifications.filter(n => n.is_read).length})
                        </button>
                    </div>
                    {notifications.some(n => !n.is_read) && (
                        <button onClick={markAllAsRead} className="text-teal-600 hover:text-teal-700 font-semibold">
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <span className="text-6xl mb-4 block">📭</span>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Notifications</h3>
                        <p className="text-gray-600">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notif) => (
                            <div key={notif.id} className={`bg-white rounded-lg shadow p-6 ${!notif.is_read ? 'border-l-4 border-blue-500' : ''}`}>
                                <div className="flex gap-4">
                                    <span className="text-3xl">{getIcon(notif.type)}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-gray-800">{notif.title}</h3>
                                            {!notif.is_read && (
                                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">NEW</span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 mb-3">{notif.message}</p>
                                        <p className="text-sm text-gray-500">{formatDate(notif.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentNotifications;
