import { Navigate, Outlet } from 'react-router-dom';
import { getSession } from '../lib/auth';

export function RequireAuth() {
  const session = getSession();
  if (!session?.accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
