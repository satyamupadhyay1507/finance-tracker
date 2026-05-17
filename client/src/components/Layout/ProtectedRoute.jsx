import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// protects routes that need login
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-[var(--text-secondary)]">
        <div className="w-10 h-10 border-[3px] border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin"></div>
        <p>Loading...</p>
      </div>
    );
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
