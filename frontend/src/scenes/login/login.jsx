// src/scenes/login/login.jsx
import { useState } from "react";
import { useAuth } from "../context/auth_context";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography } from "@mui/material";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();

            if (response.ok && data.token) {
                login(data.token); // Set auth token
                navigate("/"); // redirect to dashboard
            } else {
                alert("Login failed: " + data.error);
            }
        } catch (error) {
            console.error("Error: ", error);
            alert("Login failed due to network issues.");
        }
    };

    return (
        <Box>
            <Typography variant="h4">Login</Typography>
            <form onSubmit={handleSubmit}>
                <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth />
                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
                <Button type="submit" variant="contained" color="primary">Login</Button>
            </form>
        </Box>
    );
}

export default Login;