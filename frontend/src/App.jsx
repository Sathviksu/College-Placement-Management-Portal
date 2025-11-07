import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentDrives from './pages/StudentDrives';
import DriveDetails from './pages/DriveDetails';
import ApplyDrive from './pages/ApplyDrive';
import HODDashboard from './pages/HODDashboard';
import TPODashboard from './pages/TPODashboard';
import StudentApplications from './pages/StudentApplications';
import TPOCompanies from './pages/TPOCompanies';
import TPODrives from './pages/TPODrives';              // ADD THIS
import TPOCreateDrive from './pages/TPOCreateDrive';
import TPOApplications from './pages/TPOApplications';
import HODStudents from './pages/HODStudents';
import TPOAnalytics from './pages/TPOAnalytics';
import StudentNotifications from './pages/StudentNotifications';
import TPORoundManagement from './pages/TPORoundManagement';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            success: {
              iconTheme: { primary: '#14b8a6', secondary: '#fff' }
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' }
            }
          }}
        />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentApplications />
              </ProtectedRoute>
            }
          />
          <Route path="/tpo/analytics" element={
            <ProtectedRoute allowedRoles={['tpo']}>
              <TPOAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/hod/students" element={
            <ProtectedRoute allowedRoles={['hod']}>
              <HODStudents />
            </ProtectedRoute>
          } />
          <Route path="/tpo/drives/:driveId/rounds" element={
            <ProtectedRoute allowedRoles={['tpo']}>
              <TPORoundManagement />
            </ProtectedRoute>
          } />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/student/notifications" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentNotifications />
            </ProtectedRoute>
          } />
          <Route
            path="/tpo/applications"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <TPOApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpo/companies"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <TPOCompanies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpo/drives"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <TPODrives />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpo/drives/create"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <TPOCreateDrive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/drives"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDrives />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/drives/:driveId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DriveDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/apply/:driveId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ApplyDrive />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hod/dashboard"
            element={
              <ProtectedRoute allowedRoles={['hod']}>
                <HODDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tpo/dashboard"
            element={
              <ProtectedRoute allowedRoles={['tpo']}>
                <TPODashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
