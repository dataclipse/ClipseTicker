// src/scenes/global/topbar.jsx
import { Box, IconButton, useTheme } from "@mui/material";
import { useContext, useState } from "react";
import { ColorModeContext, tokens } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { useAuth} from "../../context/auth_context";
import { useLocation, useNavigate } from "react-router-dom";

// Topbar component that includes color mode toggle, notifications, and user menu.
// Renders different options based on whether the user is on the login page or logged in.
const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle opening the user menu
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle closing the user menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle user logout
  const handleLogout = () => {
    logout();
    handleClose();
  };

  // Navigate to profile page
  const handleProfileClick = () => {
    navigate("/profile");
    handleClose();
  }

  // Check if the current page is the login page
  const isLoginPage = location.pathname === "/login";

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* Left side of the topbar (currently empty but structured for future additions) */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
      />

      {/* Right side of the topbar with icons */}
      <Box display="flex">
        {/* Toggle theme between light and dark mode */}
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon /> 
          )}
        </IconButton>

        {/* Notifications and user menu are hidden on the login page */}
        {!isLoginPage && (
          <IconButton>
            <NotificationsOutlinedIcon />
          </IconButton>
        )}

        {/* User profile icon opens a dropdown menu */}
        {!isLoginPage && (
          <IconButton onClick={handleMenu}>
            <PersonOutlinedIcon />
          </IconButton>
        )}

        {/* User dropdown menu with Profile and Logout options */}
        <Menu 
          id="user-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{ mt: '35px' }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          >
            <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;
