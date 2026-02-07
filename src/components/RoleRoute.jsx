import { Navigate } from 'react-router-dom';
import { getAuthUser } from '../utils/auth';

/**
 * Role-based route guard.
 * If role is not allowed, user is redirected.
 */
export default function RoleRoute({ allow = [], children }) {
  // Backend role enum uses HRD, but some UI allow-lists use "HR".
  // Normalize both sides so HR/HRD behave the same.
  const roleRaw = String(getAuthUser()?.role || '').toUpperCase();
  const role = roleRaw === 'HR' ? 'HRD' : roleRaw;
  const allowUpper = allow
    .map((r) => String(r).toUpperCase())
    .map((r) => (r === 'HR' ? 'HRD' : r));

  if (allowUpper.length && !allowUpper.includes(role)) {
    // HOD should land only on Skills/Designations area
    if (role === 'HOD') return <Navigate to="/skills" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
