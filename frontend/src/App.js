import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider, Box } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import Topbar from "./scenes/global/topbar";
import Sidebar from "./scenes/global/sidebar.jsx";
import Dashboard from "./scenes/dashboard";
import Jobs from "./scenes/jobs";
import Stocks from "./scenes/stocks";
import ApiKeys from "./scenes/api_keys";
import StockDetails from "./scenes/stock_details";

function App() {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="app" display={"flex"}>
          <Sidebar />
          <Box
            className="content"
            component="main"
            sx={{ flexGrow: 1, padding: "20px", marginLeft: "250px" }}
          >
            <Topbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/api_keys" element={<ApiKeys />} />
              <Route path="/stocks/:ticker" element={<StockDetails />} />
            </Routes>
          </Box>
        </Box>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
