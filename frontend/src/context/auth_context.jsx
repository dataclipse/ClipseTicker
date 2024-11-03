// src/context/auth_context.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const navigate = useNavigate();
    
    const login = (token, role, username, email, currency_preference, theme_preference) => {
        setUser({ token, role, username, email, currency_preference, theme_preference });
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_role", role);
        localStorage.setItem("auth_username", username);
        localStorage.setItem("auth_email", email);
        localStorage.setItem("auth_currency_preference", currency_preference);
        localStorage.setItem("auth_theme_preference", theme_preference);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_role");
        localStorage.removeItem("auth_username");
        localStorage.removeItem("auth_email");
        localStorage.removeItem("auth_currency_preference");
        localStorage.removeItem("auth_theme_preference");
        navigate("/login");
    }; 

    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token");
        const storedRole = localStorage.getItem("auth_role");
        const storedUsername = localStorage.getItem("auth_username");
        const storedEmail = localStorage.getItem("auth_email");
        const storedCurrency = localStorage.getItem("auth_currency_preference");
        const storedTheme = localStorage.getItem("auth_theme_preference");
        if (storedToken) {
            setUser({ token: storedToken, role: storedRole, username: storedUsername, email: storedEmail, currency_preference: storedCurrency, theme_preference: storedTheme });
        }        
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);