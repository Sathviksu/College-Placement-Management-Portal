import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Add token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Handle response errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                console.warn('401 Unauthorized error received:', error.response.data);
                // TODO: optionally logout user here to force re-auth
            } else {
                console.error(`HTTP error ${error.response.status}:`, error.response.data);
            }
        } else if (error.code === 'ECONNABORTED') {
            console.error('Request timeout:', error.message);
        } else {
            console.error('Network or unknown error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;

// Health
export const healthCheck = () => api.get('/health');

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const logout = () => api.post('/auth/logout');
export const getCurrentUser = () => api.get('/auth/me');
export const resendWelcomeEmail = () => api.post('/auth/resend-welcome');

// Student
export const getStudentProfile = () => api.get('/student/profile');
export const getStudentDrives = () => api.get('/student/drives');
export const getDriveDetails = (driveId) => api.get(`/student/drives/${driveId}`);
export const applyToDrive = (driveId) => api.post(`/student/apply/${driveId}`);
export const getStudentApplications = () => api.get('/student/applications');

// TPO - Companies
export const getCompanies = (search) => api.get(`/tpo/companies${search ? `?search=${encodeURIComponent(search)}` : ''}`);
export const createCompany = (data) => api.post('/tpo/companies', data);
export const updateCompany = (companyId, data) => api.put(`/tpo/companies/${companyId}`, data);
export const deleteCompany = (companyId) => api.delete(`/tpo/companies/${companyId}`);

// TPO - Drives
export const getTpoDrives = () => api.get('/tpo/drives');
export const createDrive = (data) => api.post('/tpo/drives', data);
export const updateDrive = (driveId, data) => api.put(`/tpo/drives/${driveId}`, data);
export const deleteDrive = (driveId) => api.delete(`/tpo/drives/${driveId}`);

// TPO - Applications
export const getTpoApplications = () => api.get('/tpo/applications');
export const updateApplicationStatus = (applicationId, data) => api.put(`/tpo/applications/${applicationId}`, data);

// HOD - Students
export const getHodStudents = (filter, search) => api.get(`/hod/students?status=${filter}&search=${encodeURIComponent(search)}`);
export const approveStudent = (studentId) => api.post(`/hod/students/${studentId}/approve`);
export const rejectStudent = (studentId, reason) => api.post(`/hod/students/${studentId}/reject`, { reason });

// HOD Analytics (example)
export const getHodAnalytics = () => api.get('/hod/analytics');

