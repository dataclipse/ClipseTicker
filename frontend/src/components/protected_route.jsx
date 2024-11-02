// src/components/proteced_routes.jsx
import { useAuth } from "../context/auth_context"
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, required_role }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if ( required_role && user.role !== required_role ) {
        return <Navigate to="/" replace />;
    }
    return children;
}

export default ProtectedRoute;