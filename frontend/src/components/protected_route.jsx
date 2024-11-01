// src/components/proteced_routes.jsx
import { useAuth } from "../context/auth_context"
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export default ProtectedRoute;