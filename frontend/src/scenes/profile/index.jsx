// src/scenes/dashboard/index.jsx
import { Box, Typography, TextField, useTheme, MenuItem, Link, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/header";
import { useAuth } from "../../context/auth_context";
import { useState } from "react";

const Profile = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { user } = useAuth();

    const [currency, setCurrency] = useState(user?.currency || "USD");
    const [themePreference, setThemePreference] = useState(theme.palette.mode);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [fieldToEdit, setFieldToEdit] = useState("");

    const handleCurrencyChange = (event) => {
        setCurrency(event.target.value);
    };

    const handleThemeChange = (event) => {
        setThemePreference(event.target.value);
    };

    const handleOpenDialog = (field) => {
        setFieldToEdit(field);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setFieldToEdit("");
    };

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Header title="Edit Profile" subtitle="Manage your account details" />
            </Box>

            <Box
                display="grid"
                gridTemplateColumns="repeat(12, 1fr)"
                gap="10px"
                mt={2}
            >
                <Box
                    gridColumn="span 6"
                    backgroundColor={colors.primary[400]}
                    p={2}
                    borderRadius="8px"
                >
                    <Typography variant="h6">Username</Typography>
                    <TextField
                        fullWidth
                        disabled
                        value={user?.username || ""}
                        variant="outlined"
                        margin="dense"
                        sx={{ mb: 1 }}
                    />
                    <Box textAlign="right">
                        <Link color="secondary" component="button" variant="body2" onClick={() => handleOpenDialog("Username")}>
                            Change Username
                        </Link>
                    </Box>
                    <Typography variant="h6" sx={{ mt: 3 }}>Password</Typography>
                    <TextField
                        fullWidth
                        disabled
                        value={"**********"}
                        variant="outlined"
                        margin="dense"
                        sx={{ mb: 1 }}
                    />
                    <Box textAlign="right">
                        <Link color="secondary" component="button" variant="body2" onClick={() => handleOpenDialog("Password")}>
                            Change Password
                        </Link>
                    </Box>
                    <Typography variant="h6" sx={{ mt: 3 }} >Email</Typography>
                    <TextField
                        fullWidth
                        disabled
                        value={user?.email || ""}
                        variant="outlined"
                        margin="dense"
                        sx={{ mb: 1 }}
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
                    >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                        <MenuItem value="JPY">JPY</MenuItem>
                    </TextField>
                    <Typography variant="h6" sx={{ mt: 3 }}>Preferred Theme</Typography>
                    <TextField
                        fullWidth
                        select
                        value={themePreference}
                        onChange={handleThemeChange}
                        variant="outlined"
                        margin="dense"
                    >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                    </TextField>
                </Box>
            </Box>

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>{`Change ${fieldToEdit}`}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={fieldToEdit}
                        type={fieldToEdit === "Password" ? "password" : "text" }
                        fullWidth
                        variant="outlined"
                        color={colors.redAccent[500]}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color={colors.redAccent[500]} sx={{ backgroundColor: colors.grey[500] }}>
                        Cancel
                    </Button>
                    <Button onClick={handleCloseDialog} color={colors.redAccent[500]} sx={{ backgroundColor: colors.blueAccent[700] }}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Profile;
