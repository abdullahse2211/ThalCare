/**
 * ThalCare - Alpha Thalassemia Detection System
 * Main Application Component with Routing
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Auth Components
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DashboardPage';
import DoctorPatients from './pages/doctor/PatientsPage';
import DoctorPatientDetail from './pages/doctor/PatientDetailPage';
import DoctorNewPatient from './pages/doctor/NewPatientPage';
import DoctorPendingTests from './pages/doctor/PendingTestsPage';
import DoctorPredictions from './pages/doctor/PredictionsPage';
import DoctorPredictionDetail from './pages/doctor/PredictionDetailPage';
import DoctorAnalytics from './pages/doctor/AnalyticsPage';

// Lab Technician Pages
import LabDashboard from './pages/lab-technician/DashboardPage';
import LabPatients from './pages/lab-technician/PatientsPage';
import LabNewPatient from './pages/lab-technician/NewPatientPage';
import LabTestEntry from './pages/lab-technician/TestEntryPage';
import LabUpload from './pages/lab-technician/UploadPage';
import LabTests from './pages/lab-technician/TestsPage';
import LabPatientDetail from './pages/lab-technician/PatientDetailPage';

// Admin Pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminUsers from './pages/admin/UsersPage';
import AdminNewUser from './pages/admin/NewUserPage';
import AdminLogs from './pages/admin/AuditLogsPage';
import AdminConfig from './pages/admin/ConfigurationPage';

// Shared Pages
import ProfilePage from './pages/shared/ProfilePage';
import NotFoundPage from './pages/shared/NotFoundPage';

// Constants
import { USER_ROLES } from './constants';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorDashboard />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="patients/new" element={<DoctorNewPatient />} />
            <Route path="patients/:id" element={<DoctorPatientDetail />} />
            <Route path="pending-tests" element={<DoctorPendingTests />} />
            <Route path="predictions" element={<DoctorPredictions />} />
            <Route path="predictions/:id" element={<DoctorPredictionDetail />} />
            <Route path="tests/new" element={<LabTestEntry />} />
            <Route path="analytics" element={<DoctorAnalytics />} />
            <Route path="settings" element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Lab Technician Routes */}
          <Route
            path="/lab"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.LAB_TECHNICIAN]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<LabDashboard />} />
            <Route path="dashboard" element={<LabDashboard />} />
            <Route path="patients" element={<LabPatients />} />
            <Route path="patients/new" element={<LabNewPatient />} />
            <Route path="tests" element={<LabTests />} />
            <Route path="tests/new" element={<LabTestEntry />} />
            <Route path="tests/:id" element={<LabTestEntry />} />
            <Route path="patients/:id" element={<LabPatientDetail />} />
            <Route path="upload" element={<LabUpload />} />
            <Route path="settings" element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/new" element={<AdminNewUser />} />
            <Route path="users/:id" element={<AdminNewUser />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="config" element={<AdminConfig />} />
            <Route path="settings" element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
