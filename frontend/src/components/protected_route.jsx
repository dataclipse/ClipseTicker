// src/components/proteced_routes.jsx
import { useAuth } from "../context/auth_context"
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, required_role }) {
    // Use the custom hook useAuth() to retrieve the authenticated user information
    const { user } = useAuth();

    // If user is not authenticated or does not have the required role, redirect to home or login based on authentication
    if (!user || (required_role && user.role !== required_role)) {
        return <Navigate to={user ? "/" : "/login"} replace />;
    }

    // Render the children components if user is authenticated and has the required role
    return children;
}

export default ProtectedRoute;