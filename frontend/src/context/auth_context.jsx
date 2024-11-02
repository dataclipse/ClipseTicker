// src/context/auth_context.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const navigate = useNavigate();
    
    const login = (token, role, username) => {
        setUser({ token, role, username });
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_role", role);
        localStorage.setItem("auth_username", username);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_role");
        localStorage.removeItem("auth_username");
        navigate("/login");
    }; 

    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token");
        const storedRole = localStorage.getItem("auth_role");
        const storedUsername = localStorage.getItem("auth_username");
        if (storedToken && storedRole) {
            setUser({ token: storedToken, role: storedRole, username: storedUsername });
        }        
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);