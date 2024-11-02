// src/context/auth_context.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(false)
    const navigate = useNavigate();
    
    const login = (token, role) => {
        setUser({ token, role });
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_role", role);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_role");
        navigate("/login");
    }; 

    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token");
        const storedRole = localStorage.getItem("auth_role");
        if (storedToken && storedRole) {
            setUser({ token: storedToken, role: storedRole });
        }        
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);