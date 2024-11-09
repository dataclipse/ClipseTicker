// src/scenes/dashboard/index.jsx
import { Box, Typography, TextField, useTheme, MenuItem, Link, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/header";
import { useAuth } from "../../context/auth_context";
import { useState, useEffect, useCallback } from "react";

// Profile Component - Allows users to view and update their profile information, including username, password, email,
// currency preference, and theme preference.

const Profile = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { user } = useAuth();

    const [currency, setCurrency] = useState("USD");
    const [themePreference, setThemePreference] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [fieldToEdit, setFieldToEdit] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

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
    }, [user.username]);

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
        setFieldToEdit(field);
        if (field === "Username") {
            setNewValue(username);
        } else if (field === "Email") {
            setNewValue(email);
        } else {
            setNewValue("");  
        }
        setNewPassword("");
        setNewPasswordConfirm("");
        setDialogOpen(true);
    };

    // Closes the edit dialog and resets the fieldToEdit state.
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setFieldToEdit("");
    };

    // Handles saving changes for the selected field, validates passwords, and makes an API request to update the user profile.
    const handleSave = useCallback(async () => {
        const payload = {
            username,
        };
        if (fieldToEdit === "Username") {
            payload.new_username = newValue;
        } else if (fieldToEdit === "Password") {
            if (newPassword !== newPasswordConfirm) {
                alert("Passwords do not match.");
                return;
            }
            payload.new_password = newPassword;
        } else if (fieldToEdit === "Email") {
            payload.new_email = newValue;
        } else if (fieldToEdit === "Currency") {
            payload.new_currency = currency;
        } else if (fieldToEdit === "Theme") {
            payload.new_theme = themePreference;
        }

        try {
            const token = localStorage.getItem("auth_token");
            // Make the API call to update the user using fetch
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

            // Optionally, update local state to reflect changes immediately
            handleCloseDialog();
            if (fieldToEdit === "Currency") setCurrency(currency);
            if (fieldToEdit === "Theme") setThemePreference(themePreference);;
            // Show success message or refresh user context as necessary
            console.log("User updated successfully.");
        } catch (error) {
            console.error("Error updating user:", error);
            // Handle error (e.g., show an alert or notification)
            alert("Failed to update user data. Please try again.");
        }
        fetchUserProfile();
    }, [username, fieldToEdit, newValue, newPassword, newPasswordConfirm, currency, themePreference, fetchUserProfile]);

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
                        fullWidth
                        disabled
                        value={"**********"}
                        variant="outlined"
                        margin="dense"
                        sx={{ mb: 1 }}
                        color={colors.redAccent[500]}
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
                            type={fieldToEdit === "Password" ? "password" : "text" }
                            fullWidth
                            variant="outlined"
                            color={colors.redAccent[500]}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    width: '50vh', // Increase height
                                },
                            }}
                            onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <Typography variant="h6" sx={{ mt: 3 }}>Reenter Password</Typography>
                            <TextField 
                                autoFocus
                                margin="dense"
                                label="Reenter Password"
                                type={fieldToEdit === "Password" ? "password" : "text" }
                                fullWidth
                                variant="outlined"
                                color={colors.redAccent[500]}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        width: '50vh', // Increase height
                                    },
                                }}
                                onChange={(e) => setNewPasswordConfirm(e.target.value)}
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
                            value={newValue}
                            color={colors.redAccent[500]}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    width: '50vh', // Increase height
                                },
                            }}
                            onChange={(e) => setNewValue(e.target.value)} // Capture new value
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
