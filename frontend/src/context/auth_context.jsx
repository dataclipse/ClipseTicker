// src/context/auth_context.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Create an AuthContext to provide authentication data to the app
const AuthContext = createContext();

// AuthProvider component to wrap parts of the app that need access to authentication state
export const AuthProvider = ({ children }) => {
    // State to hold user data, initialized to null
    const [user, setUser] = useState(null)
    const navigate = useNavigate();
    
    // Function to handle setting user data and localStorage
    const setUserData = (token, role, username) => {
        const userData = { token, role, username };
        setUser(userData);
        // Store user data in localStorage for persistent authentication
        Object.entries(userData).forEach(([key, value]) => {
            localStorage.setItem(`auth_${key}`, value);
        });
    };

    // Login function
    const login = (token, role, username) => {
        setUserData(token, role, username);
    };

    // Logout function
    const logout = () => {
        setUser(null);
        // Remove user data from localStorage
        ["token", "role", "username"].forEach(key => {
            localStorage.removeItem(`auth_${key}`);
        });
        navigate("/login");
    };

    // useEffect to check for stored user data in localStorage on initial load
    useEffect(() => {
        const storedUser = {
            token: localStorage.getItem("auth_token"),
            role: localStorage.getItem("auth_role"),
            username: localStorage.getItem("auth_username"),
        };
        
        // Set user state if token is found, restoring the session
        if (storedUser.token) {
            setUser(storedUser);
        }        
    }, []);

    // Provide user, login, and logout functions to all children of AuthProvider
    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy access to the AuthContext
export const useAuth = () => useContext(AuthContext);