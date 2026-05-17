import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// this wrapper protects routes so unauthenticated users get bounced
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    // just return simple text for now while loading
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
