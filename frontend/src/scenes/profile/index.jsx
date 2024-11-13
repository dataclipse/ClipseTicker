// src/scenes/dashboard/index.jsx
import { Box, Typography, TextField, useTheme, MenuItem, Link, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/header";
import { useAuth } from "../../context/auth_context";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Profile Component - Allows users to view and update their profile information, including username, password, email,
// currency preference, and theme preference.

const Profile = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currency, setCurrency] = useState("USD");
    const [themePreference, setThemePreference] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [fieldToEdit, setFieldToEdit] = useState("");
    const [dialogData, setDialogData] = useState({
        field: "",
        value: "",
        newPassword: "",
        newPasswordConfirm: ""
    });

    // Fetches the user's profile data from the API and updates the state with the user's information.
    const fetchUserProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`/api/user/${user.username}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (response.status === 401 ) {
                // Unauthorized, redirect to login page
                navigate("/login");
                return;
            }
            if (response.ok) {
                const userData = await response.json();
                // Populate state with user data
                setUsername(userData.username);
                setEmail(userData.email);
                setCurrency(userData.currency_preference);
                setThemePreference(userData.theme_preference);
            } else {
                console.error("Failed to fetch user profile:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error)
        }
    }, [user.username, navigate]);

    // Handlers for changing currency and theme preference, which update the respective state values.
    const handleCurrencyChange = (event) => {
        setFieldToEdit("Currency")
        setCurrency(event.target.value);
    };

    const handleThemeChange = (event) => {
        setFieldToEdit("Theme")
        setThemePreference(event.target.value);
    };

    // Opens a dialog for editing a specific field (username, password, or email) by setting relevant state variables.
    const handleOpenDialog = (field) => {
        setDialogData({
            field,
            value: field === "Username" ? username : field === "Email" ? email : "",
            newPassword: "",
            newPasswordConfirm: ""
        });
        setDialogOpen(true);
    };

    // Closes the edit dialog and resets the fieldToEdit state.
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setFieldToEdit("");
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDialogData(prev => ({ ...prev, [name]: value }));
    };
    // Handles saving changes for the selected field, validates passwords, and makes an API request to update the user profile.
    const handleSave = useCallback(async () => {
        const payload = {
            username,
            new_username: dialogData.field === "Username" ? dialogData.value : undefined,
            new_password: dialogData.field === "Password" && dialogData.newPassword === dialogData.newPasswordConfirm ? dialogData.newPassword : undefined,
            new_email: dialogData.field === "Email" ? dialogData.value : undefined,
            new_currency: dialogData.field === "Currency" ? currency : undefined,
            new_theme: dialogData.field === "Theme" ? themePreference : undefined,
        };
    
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch("/api/user", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
    
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
    
            handleCloseDialog();
            fetchUserProfile();
            console.log("User updated successfully.");
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user data. Please try again.");
        }
    }, [username, dialogData, currency, themePreference, fetchUserProfile]);

    // Automatically saves changes when either currency or theme preference is updated by the user.
    useEffect(() => {
        if (fieldToEdit === "Currency" || fieldToEdit === "Theme" ) {
            handleSave();
        }
    }, [currency, themePreference, fieldToEdit, handleSave]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile, theme.palette.mode]);

    

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Header title="Edit Profile" subtitle="Manage your account details" />
            </Box>

            {/* Profile fields for user information */}
            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="10px" mt={2} >
                <Box gridColumn="span 6" backgroundColor={colors.primary[400]} p={2} borderRadius="8px" >

                    {/* Password Field */}
                    <Typography variant="h6">Username</Typography>
                    <TextField
                        fullWidth
                        disabled
                        value={username || ""}
                        variant="outlined"
                        margin="dense"
                        sx={{ mb: 1 }}
                        color={colors.redAccent[500]}
                    />
                    <Box textAlign="right">
                        <Link color="secondary" component="button" variant="body2" onClick={() => handleOpenDialog("Username")}>
                            Change Username
                        </Link>
                    </Box>

                    {/* Email Field */}
                    <Typography variant="h6" sx={{ mt: 3 }}>Password</Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={dialogData.field}
                        type={dialogData.field === "Password" ? "password" : "text"}
                        fullWidth
                        variant="outlined"
                        value={dialogData.field === "Password" ? dialogData.newPassword : dialogData.value}
                        color={colors.redAccent[500]}
                        onChange={handleInputChange} // Capture new value
                        name={dialogData.field === "Password" ? "newPassword" : "value"} // Set name for input
                    />
                    <Box textAlign="right">
                        <Link color="secondary" component="button" variant="body2" onClick={() => handleOpenDialog("Password")}>
                            Change Password
                        </Link>
                    </Box>

                    {/* Preferred Currency Selection */}
                    <Typography variant="h6" sx={{ mt: 3 }} >Email</Typography>
                    <TextField
                        fullWidth
                        disabled
                        value={email || ""}
                        variant="outlined"
                        margin="dense"
                        sx={{ mb: 1 }}
                        color={colors.redAccent[500]}
                    />
                    <Box textAlign="right">
                        <Link color="secondary" component="button" variant="body2" onClick={() => handleOpenDialog("Email")}>
                            Change Email
                        </Link>
                    </Box>
                    <Typography variant="h6" sx={{ mt: 3 }}>Preferred Currency</Typography>
                    <TextField
                        fullWidth
                        select
                        value={currency}
                        onChange={handleCurrencyChange}
                        variant="outlined"
                        margin="dense"
                        color={colors.redAccent[500]}
                    >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                        <MenuItem value="JPY">JPY</MenuItem>
                    </TextField>

                    {/* Preferred Theme Selection */}
                    <Typography variant="h6" sx={{ mt: 3 }}>Preferred Theme</Typography>
                    <TextField
                        fullWidth
                        select
                        value={themePreference}
                        onChange={handleThemeChange}
                        variant="outlined"
                        margin="dense"
                        color={colors.redAccent[500]}
                    >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                    </TextField>
                </Box>
            </Box>

            {/* Dialog for editing username, email, or password */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} >
                <DialogTitle>{`Change ${fieldToEdit}`}</DialogTitle>
                <DialogContent>
                    {fieldToEdit === "Password" && (
                        <>
                            <Typography variant="h6" sx={{ mt: 3 }}>New Password</Typography>
                            <TextField
                                autoFocus
                                margin="dense"
                                label={fieldToEdit}
                                type="password"
                                fullWidth
                                variant="outlined"
                                color={colors.redAccent[500]}
                                value={dialogData.newPassword} // Use dialogData for newPassword
                                onChange={handleInputChange} // Capture new value
                                name="newPassword" // Set name for input
                            />
                            <Typography variant="h6" sx={{ mt: 3 }}>Reenter Password</Typography>
                            <TextField 
                                autoFocus
                                margin="dense"
                                label="Reenter Password"
                                type="password"
                                fullWidth
                                variant="outlined"
                                color={colors.redAccent[500]}
                                value={dialogData.newPasswordConfirm} // Use dialogData for newPasswordConfirm
                                onChange={handleInputChange} // Capture new value
                                name="newPasswordConfirm" // Set name for input
                            />
                        </>
                    )}
                    {fieldToEdit !== "Password" && (
                        <TextField
                            autoFocus
                            margin="dense"
                            label={fieldToEdit}
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={dialogData.value}
                            color={colors.redAccent[500]}
                            onChange={handleInputChange} // Capture new value
                            name="value" // Set name for input
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color={colors.redAccent[500]} sx={{ backgroundColor: colors.grey[500] }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} color={colors.redAccent[500]} sx={{ backgroundColor: colors.blueAccent[700] }}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Profile;
