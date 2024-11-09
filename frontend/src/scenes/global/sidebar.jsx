// src/scenes/global/sidbar.jsx
import {
  Box,
  Typography,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Link } from "react-router-dom";
import { tokens } from "../../theme";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WorkIcon from "@mui/icons-material/Work";
import KeyIcon from "@mui/icons-material/Key";
import { useState } from "react";
import { useAuth } from "../../context/auth_context";

// Sidebar item component for a clickable navigation link.
// Changes color when selected and navigates to the specified route.
const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <ListItem
      button
      component={Link}
      to={to}
      onClick={() => setSelected(title)}
    >
      <ListItemIcon
        style={{
          color: selected === title ? colors.blueAccent[700] : colors.grey[100],
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText primary={title} style={{ color: colors.grey[100] }} />
    </ListItem>
  );
};

// Sidebar component for application navigation.
// Displays links to different pages based on user role and allows for role-based menu items.
const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selected, setSelected] = useState("Dashboard");
  const { user } = useAuth();

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          "& .MuiDrawer-paper": {
            background: `${colors.primary[400]} !important`,
            width: 250,
            height: "100%",
          },
        }}
      >

        {/* Sidebar content */}
        <Box
          sx={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >

          {/* Application title */}
          <Box mb="25px">
            <Typography
              variant="h2"
              color={colors.grey[100]}
              align="center"
              fontWeight="bold"
            >
              ClipseTicker
            </Typography>
          </Box>

          {/* User profile image */}
          <Box
            mb="10px"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <img
              alt="profile-user"
              width="50px"
              height="50px"
              src={"../../assets/logo.png"}
              style={{ cursor: "pointer", borderRadius: "20%" }}
            />
          </Box>

          {/* User name and role display */}
          <Box textAlign="center">
            <Typography
              variant="h4"
              color={colors.grey[100]}
              fontWeight="bold"
              sx={{ m: "1px 0 0 0" }}
            >
              {user?.username}
            </Typography>
            <Typography variant="h5" color={colors.greenAccent[500]}>
              {user?.role}
            </Typography>
          </Box>

          {/* Sidebar navigation items */}
          <List sx={{ marginTop: "20px" }}>
            <Item
              title="Dashboard"
              to="/"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
          </List>
          <Typography
            variant="h6"
            fontWeight={"bold"}
            color={colors.grey[300]}
            sx={{ m: "15px 0 5px 20px" }}
          >
            Markets
          </Typography>
          <List>
            <Item
              title="Stocks"
              to="/stocks"
              icon={<ShowChartIcon />}
              selected={selected}
              setSelected={setSelected}
            />
          </List>
          <Typography
            variant="h6"
            color={colors.grey[300]}
            fontWeight={"bold"}
            sx={{ m: "15px 0 5px 20px" }}
          >
            Data
          </Typography>
          <List>
            <Item
              title="Job Scheduler"
              to="/jobs"
              icon={<WorkIcon />}
              selected={selected}
              setSelected={setSelected}
            />
          </List>

          {/* Settings section, only visible to Admin users */}
          {user?.role === "Admin" && (
            <>
              <Typography
                variant="h6"
                color={colors.grey[300]}
                fontWeight={"bold"}
                sx={{ m: "15px 0 5px 20px" }}
              >
                Settings
              </Typography>
              <List>
                <Item
                  title="API Keys"
                  to="/api_keys"
                  icon={<KeyIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
              </List>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
