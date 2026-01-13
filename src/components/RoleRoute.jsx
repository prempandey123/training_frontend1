import { Navigate } from 'react-router-dom';
import { getAuthUser } from '../utils/auth';

/**
 * Role-based route guard.
 * If role is not allowed, user is redirected.
 */
export default function RoleRoute({ allow = [], children }) {
  const role = String(getAuthUser()?.role || '').toUpperCase();
  const allowUpper = allow.map((r) => String(r).toUpperCase());

  if (allowUpper.length && !allowUpper.includes(role)) {
    // HOD should land only on Skills/Designations area
    if (role === 'HOD') return <Navigate to="/skills" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
