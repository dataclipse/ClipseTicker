import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(null); 

    useEffect(() => {
        const role = localStorage.getItem("auth_role");
        setUserRole(role);
    }, []);

    return(
        <UserContext.Provider value={{ userRole }}>
            {children}
        </UserContext.Provider> 
    ); 
};

export const useUserContext = () => useContext(UserContext);