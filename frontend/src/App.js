// src/App.js
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider, Box } from "@mui/material";
import { Routes, Route, useLocation } from "react-router-dom";
import Topbar from "./scenes/global/topbar";
import Sidebar from "./scenes/global/sidebar";
import Dashboard from "./scenes/dashboard";
import Jobs from "./scenes/jobs";
import DailyAvg from "./scenes/stocks/daily_avg";
import ApiKeys from "./scenes/api_keys";
import DailyAvgDetails from "./scenes/stock_details/daily_avg";
import StockScreener from "./scenes/stocks/stock_screener";
import StockScreenerDetails from "./scenes/stock_details/stock_screener";
import Login from "./scenes/login";
import Profile from "./scenes/profile";
import ProtectedRoute from "./components/protected_route";
import { useMemo } from "react";

// Main App Component - Renders the application layout and routes.
// - Integrates theme management with dark/light modes.
// - Provides protected routing for specific pages based on user authentication and roles.
// - Dynamically shows/hides Sidebar based on the current route.
function App() {
  const [theme, colorMode] = useMode();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  const routes = useMemo(() => (
    <>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/stocks/daily_avg" element={<ProtectedRoute><DailyAvg /></ProtectedRoute>} />
      <Route path="/stock_details/daily_avg/:ticker" element={<ProtectedRoute><DailyAvgDetails /></ProtectedRoute>} />
      <Route path="/stocks/stock_screener" element={<ProtectedRoute><StockScreener /></ProtectedRoute>} />
      <Route path="/stock_details/stock_screener/:ticker" element={<ProtectedRoute><StockScreenerDetails /></ProtectedRoute>} />
      <Route path="/api_keys" element={<ProtectedRoute required_role="Admin"><ApiKeys /></ProtectedRoute>} />
    </>
  ), []);

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
              {routes}
            </Routes>
          </Box>
        </Box>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
