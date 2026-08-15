import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Route guard used as a layout route in App.jsx — any <Route> nested inside
// it only renders once this component allows it.
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Still waiting to hear back from /api/auth/me — show a spinner instead
  // of flashing the wrong (logged-out) content.
  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <span className="loading loading-spinner loading-lg" aria-label="Loading" />
      </div>
    );
  }

  // Not logged in — bounce to /login, remembering where they were headed
  // so Login.jsx can send them back here after a successful login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Logged in — render whichever child route matched.
  return <Outlet />;
}

export default ProtectedRoute;
