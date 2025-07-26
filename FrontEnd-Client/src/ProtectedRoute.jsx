// components/ProtectedRoute.jsx
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ restricted = false, children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (restricted && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!restricted && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If using nested routes, render <Outlet />
  return children || <Outlet />;
};

export default ProtectedRoute;