import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Verifying session...</p>
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    // Redirect based on their actual role
    if (profile.role === 'manufacturer') {
      return <Navigate to="/manufacturer/dashboard" replace />;
    } else if (profile.role === 'distributor') {
      return <Navigate to="/distributor/dashboard" replace />;
    } else if (profile.role === 'pharmacy') {
      return <Navigate to="/pharmacy/dashboard" replace />;
    } else if (profile.role === 'disposal') {
      return <Navigate to="/disposal/destruction" replace />;
    }
    // Fallback if role is somehow invalid
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
