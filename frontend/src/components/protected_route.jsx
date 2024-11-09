// src/components/proteced_routes.jsx
import { useAuth } from "../context/auth_context"
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, required_role }) {
    // Use the custom hook useAuth() to retrieve the authenticated user information
    const { user } = useAuth();

    // Redirect to the login page if the user is not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to the home page if the user does not have the required role
    if ( required_role && user.role !== required_role ) {
        return <Navigate to="/" replace />;
    }

    // Render the children components if user is authenticated and has the required role
    return children;
}

export default ProtectedRoute;