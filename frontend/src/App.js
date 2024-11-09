// src/App.js
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider, Box } from "@mui/material";
import { Routes, Route, useLocation } from "react-router-dom";
import Topbar from "./scenes/global/topbar";
import Sidebar from "./scenes/global/sidebar";
import Dashboard from "./scenes/dashboard";
import Jobs from "./scenes/jobs";
import Stocks from "./scenes/stocks";
import ApiKeys from "./scenes/api_keys";
import StockDetails from "./scenes/stock_details";
import Login from "./scenes/login";
import Profile from "./scenes/profile";
import ProtectedRoute from "./components/protected_route";

// Main App Component - Renders the application layout and routes.
// - Integrates theme management with dark/light modes.
// - Provides protected routing for specific pages based on user authentication and roles.
// - Dynamically shows/hides Sidebar based on the current route.
function App() {
  const [theme, colorMode] = useMode();
  const location = useLocation();

  // Check if the current path is the login page
  const isLoginPage = location.pathname === "/login";

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="app" display={"flex"}>

          {/* Conditionally render the Sidebar */}
          {!isLoginPage && <Sidebar />}
          <Box className="content" component="main" sx={{ flexGrow: 1, padding: "20px", marginLeft: isLoginPage ? 0 : "250px" }}> 
            <Topbar />
            <Routes>

              {/* Public route for Login page */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes with conditional access based on roles */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/stocks" element={<ProtectedRoute><Stocks /></ProtectedRoute>} />
              <Route path="/stocks/:ticker" element={<ProtectedRoute><StockDetails /></ProtectedRoute>} />

              {/* Admin-only route for managing API keys */}
              <Route path="/api_keys" element={<ProtectedRoute required_role="Admin"><ApiKeys /></ProtectedRoute>} />
              
            </Routes>
          </Box>
        </Box>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
