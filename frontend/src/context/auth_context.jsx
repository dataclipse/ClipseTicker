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
    
    // Login function to set user data and store credentials in localStorage
    const login = (token, role, username ) => {
        // Update user state with token, role, and username
        setUser({ token, role, username });

        // Store user data in localStorage for persistent authentication
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_role", role);
        localStorage.setItem("auth_username", username);
    };

    // Logout function to clear user data and navigate to the login page
    const logout = () => {
        // Clear user state
        setUser(null);

        // Remove user data from localStorage to end the session
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_role");
        localStorage.removeItem("auth_username");

        // Redirect to the login page
        navigate("/login");
    }; 

    // useEffect to check for stored user data in localStorage on initial load
    useEffect(() => {
        // Retrieve stored authentication data
        const storedToken = localStorage.getItem("auth_token");
        const storedRole = localStorage.getItem("auth_role");
        const storedUsername = localStorage.getItem("auth_username");
        
        // Set user state if token is found, restoring the session
        if (storedToken) {
            setUser({ token: storedToken, role: storedRole, username: storedUsername });
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