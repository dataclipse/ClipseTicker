// src/scenes/global/sidbar.jsx
import { Box, Typography, useTheme, Drawer, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Link } from "react-router-dom";
import { tokens } from "../../theme";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WorkIcon from "@mui/icons-material/Work";
import KeyIcon from "@mui/icons-material/Key";
import { useState } from "react";
import { useAuth } from "../../context/auth_context";
import { Collapse } from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

// Sidebar component for application navigation.
// Displays links to different pages based on user role and allows for role-based menu items.
const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selected, setSelected] = useState("Dashboard");
  const { user } = useAuth();
  const [openStocks, setOpenStocks] = useState(false);

  const handleStocksClick = () => {
    setOpenStocks(!openStocks); // Ensure this function is defined here
  };

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
            <ListItem
              button
              component={Link}
              to="/"
              onClick={() => setSelected("Dashboard")}
            >
              <ListItemIcon
                style={{
                  color: selected === "Dashboard" ? colors.blueAccent[500] : colors.grey[100],
                }}
              >
                <HomeOutlinedIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard" 
                style={{ color: colors.grey[100] }} 
              />
            </ListItem>
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
            <ListItem
              button
              onClick={handleStocksClick}
            >
              <ListItemIcon
                style={{
                  color: selected === "Stocks" ? colors.blueAccent[500] : colors.grey[100],
                }}
              >
                <ShowChartIcon />
              </ListItemIcon>
              Stocks
              {openStocks ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={openStocks} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem 
                  style={{ marginLeft: '40px', color: colors.grey[100] }} 
                  button 
                  component={Link} 
                  to="/stocks/daily_avg"
                  onClick={() => setSelected("Stocks")}
                >
                  <ListItemText primary="Daily Avg Aggregates" />
                </ListItem>
                <ListItem 
                  style={{ marginLeft: '40px', 
                  color: colors.grey[100] }} 
                  button 
                  component={Link} 
                  to="/stocks/screener"
                  onClick={() => setSelected("Stocks")} 
                >
                  <ListItemText primary="Stock Screener" />
                </ListItem>
              </List>
            </Collapse>
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
            <ListItem
              button
              component={Link}
              to="/jobs"
              onClick={() => setSelected("Job Scheduler")}
            >
              <ListItemIcon
                style={{
                  color: selected === "Job Scheduler" ? colors.blueAccent[500] : colors.grey[100],
                }}
              >
                <WorkIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Job Scheduler" 
                style={{ color: colors.grey[100] }} 
              />
            </ListItem>
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
                <ListItem
                  button
                  component={Link}
                  to="/api_keys"
                  onClick={() => setSelected("API Keys")}
                >
                  <ListItemIcon
                    style={{
                      color: selected === "API Keys" ? colors.blueAccent[500] : colors.grey[100],
                    }}
                  >
                    <KeyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="API Keys" 
                    style={{ color: colors.grey[100] }} 
                  />
                </ListItem>
              </List>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Sidebar;

