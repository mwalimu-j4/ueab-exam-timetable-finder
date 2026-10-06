import { isAuthenticated as checkAuth, clearToken } from '@/lib/auth';

export function useAuth() {
  const isAuthenticated = checkAuth();

  const logout = () => {
    clearToken();
    window.location.href = '/admin/login';
  };

  return { isAuthenticated, logout };
}
