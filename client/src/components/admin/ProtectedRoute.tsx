import { Navigate, Outlet } from '@tanstack/react-router';
import { isAuthenticated } from '@/lib/auth';

export function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" />;
  }

  return <Outlet />;
}
