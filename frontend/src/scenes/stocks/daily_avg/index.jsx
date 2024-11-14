// src/scenes/stocks/index.jsx
import { Box, useTheme, Typography, Stack } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../../theme";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "../../../components/header";
import { Link, useNavigate } from "react-router-dom";
import { QuickSearchToolbar, formatCurrency, formatDate } from "../../../components/helper";

// Stocks Component - Displays the latest stock data in a DataGrid format
// - Shows most recent OHLC (Open, High, Low, Close) data for stocks in NYSE.
const Stocks = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [stocksData, setStocksData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Column definitions for DataGrid
  const columns = useMemo(() => [
    {
      field: "ticker_symbol",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Ticker"}</Typography>
      ),
      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          alignItems={"center"}
          height={"100%"}
        >
          <Link
            to={`/stock_details/daily_avg/${params.value}`}
            style={{
              textDecoration: "none",
              color: colors.greenAccent[500],
              mx: "0.5",
            }}
          >
            <Typography sx={{ fontWeight: "bold", mx: "0.5" }}>
              {params.value}
            </Typography>
          </Link>
        </Stack>
      ),
    },
    {
      field: "open_price",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Open Price"}</Typography>
      ),
      align: "right",
      headerAlign: "right",
      flex: 1,
    },
    {
      field: "highest_price",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Highest Price"}</Typography>
      ),
      align: "right",
      headerAlign: "right",
      flex: 1,
    },
    {
      field: "lowest_price",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Lowest Price"}</Typography>
      ),
      align: "right",
      headerAlign: "right",
      flex: 1,
    },
    {
      field: "close_price",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Close Price"}</Typography>
      ),
      align: "right",
      headerAlign: "right",
      flex: 1,
    },
    {
      field: "timestamp_end",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Date"}</Typography>
      ),
      flex: 1,
    },
  ], [colors]);

  // fetchData - Fetches the latest stock data from the API.
  const fetchData = useCallback(async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/stocks", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      const data = await response.json();
      const formattedData = data.map((stock, index) => ({
        id: index,
        ticker_symbol: stock.ticker_symbol,
        open_price: formatCurrency(stock.open_price),
        close_price: formatCurrency(stock.close_price),
        highest_price: formatCurrency(stock.highest_price),
        lowest_price: formatCurrency(stock.lowest_price),
        timestamp_end: formatDate(stock.timestamp_end),
      }));
      setStocksData(formattedData);
    } catch (error) {
      console.error("Error fetching Stocks data:", error);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  }, [navigate]);

  // Set interval to refetch data every 30 seconds
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return (
    <Box m="20px">
      <Header title="NYSE" subtitle="Most Recent Daily Aggregated Average OHLC Data" />
      <Box
        m="40px 0 0 0"
        display="flex"
        height={"75vh"}
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
            fontWeight: "bold",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiCircularProgress-root": {
            color: colors.greenAccent[500],
          },
          "& .MuiPaginationItem-root": {
            borderTop: "none",
            backgroundColor: `${colors.blueAccent[700]} !important`,
          },
        }}
      >
        <DataGrid
          localeText={{
            toolbarQuickFilterPlaceholder: "Search for Ticker...",
          }}
          slots={{ toolbar: QuickSearchToolbar }}
          rows={stocksData}
          columns={columns}
          loading={loading}
        />
      </Box>
    </Box>
  );
};

export default Stocks;
