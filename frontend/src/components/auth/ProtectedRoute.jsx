/**
 * ThalCare Protected Route Component
 * Handles authentication and role-based access control
 */

import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth, UserRoles } from '../context/AuthContext';
// import { LoadingPage } from '../components/common';
import { useAuth, UserRoles } from '../../context/AuthContext';
import { LoadingPage } from '../common';
// Role to dashboard path mapping
const ROLE_DASHBOARDS = {
  [UserRoles.DOCTOR]: '/doctor',
  [UserRoles.LAB_TECHNICIAN]: '/lab',
  [UserRoles.ADMIN]: '/admin',
};

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading while checking auth status
  if (isLoading) {
    return <LoadingPage message="Verifying authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on user role
    // Normalize role to lowercase for lookup
    const roleKey = user.role?.toLowerCase();
    const redirectPath = ROLE_DASHBOARDS[roleKey] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

// Higher-order component for role-based routes
export function withRole(Component, allowedRoles) {
  return function RoleProtectedComponent(props) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Redirect authenticated users away from auth pages (login, register, etc.)
export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isAuthenticated && user) {
    // Redirect to user's dashboard based on their role
    // Normalize role to lowercase for lookup
    const roleKey = user.role?.toLowerCase();
    const redirectPath = ROLE_DASHBOARDS[roleKey] || '/login';

    // Safety check: if redirectPath is still '/', redirect to login to avoid loops
    // with the root redirect in App.jsx
    if (redirectPath === '/') {
      return <Navigate to="/login" replace />;
    }

    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default ProtectedRoute;