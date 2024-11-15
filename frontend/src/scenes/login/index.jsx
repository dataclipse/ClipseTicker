// src/scenes/login/index.jsx
import { useState, useCallback } from "react";
import { useAuth } from "../../context/auth_context.jsx";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent'; 
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme.js";

// Login Component - Provides a user login form with username and password fields,
// submits login data to the API, and handles successful or failed login attempts.
function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    // Handles form submission, sends login request, and processes response.
    // - On success: calls login function, stores token, and redirects to dashboard.
    // - On failure: displays error and clears password field.
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError(""); // Reset error on submit
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();

            if (response.ok && data.token) {
                login(data.token, data.role, data.username); // Set auth token
                localStorage.setItem("auth_token", data.token);
                navigate("/"); // redirect to dashboard
            } else {
                setError("Login failed: " + data.error); // Set error message
                setPassword('');
                console.error(data.error);
            }
        } catch (error) {
            console.error("Error: ", error);
            setError("Login failed due to network issues."); // Set error message
            setPassword('');
        }
    }, [login, navigate, username, password]);

    return (
        <Card sx={{
                padding: theme.spacing(4),
                gap: theme.spacing(2),
                margin: 'auto',  
                boxShadow:
                'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
                [theme.breakpoints.up('sm')]: {
                    width: '450px',
                },
                ...theme.applyStyles('dark', {
                    boxShadow:
                    'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
                }),
            }} 
            variant="outlined"
        >
            <form onSubmit={handleSubmit}>
                <CardContent className="login">
                    <Typography variant="h1" sx={{ fontWeight: 'bold', mb: '40px', justifyContent: 'center', display: 'flex' }} >
                        <img
                            alt=""
                            width="45px"
                            height="45px"
                            src={"../../assets/logo.png"}
                            style={{ borderRadius: "40%", marginRight: "10px" }}
                        />
                    ClipseTicker
                    </Typography>
                    <Typography variant="h3" sx={{ mb: '20px', fontWeight: 'bold' }}>
                    Login
                    </Typography>
                        <TextField 
                            sx= {{ mb: '10px '}}
                            label="Username" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            fullWidth 
                            color={colors.redAccent[500]}
                        />
                        <TextField 
                            sx= {{ mb: '10px '}}
                            label="Password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            fullWidth 
                            color={colors.redAccent[500]}
                        />
                        {error && <Typography color="error">{error}</Typography>}
                </CardContent>
                <CardActions sx={{ justifyContent: 'left' }}>
                    <Button type="submit" variant="contained" color="primary" sx= {{ ml: '10px '}} >LOG IN</Button>
                </CardActions>
            </form>
        </Card>
    );
}

export default Login;