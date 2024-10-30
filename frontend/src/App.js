import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import Topbar from "./scenes/global/topbar";
import Sidebar from "./scenes/global/sidebar";
import Dashboard from "./scenes/dashboard";
import Jobs from "./scenes/jobs";
import Stocks from "./scenes/stocks";
import ApiKeys from "./scenes/api_keys";
// import StockDetails from "./scenes/stock_details";
// import FAQ from "./scenes/faq";

function App(){
    const [theme, colorMode] = useMode();

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className="app">
                    <Sidebar />
                    <main className="content">
                        <Topbar />
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/jobs" element={<Jobs />} />
                            <Route path="/stocks" element={<Stocks />} />
                            <Route path="/api_keys" element={<ApiKeys />} />
                            {/* <Route path="/stocks/:stockId" element={<StockDetails />} /> */}
                            {/* <Route path="/faq" element={<FAQ />} /> */}
                        </Routes>
                    </main>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}

export default App;