// src/scenes/stock_details/index.jsx
import { Box, useTheme, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../../theme";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "../../../components/header";
import { useParams, useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { getCandlestickChartOptions } from "../../../components/echart_options";
import { formatCurrency, formatCurrencyChart, formatDate, formatDateChart } from "../../../components/helper";

// Stocks Component - Displays detailed stock information for a selected ticker.
// - Shows stock data in both a candlestick chart and a data grid.
const Stocks = () => {
  const { ticker } = useParams();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState({ details: [], chartData: [] });
  const options = getCandlestickChartOptions(
    ticker,
    stockData.chartData,
    colors
  );

  // Column definitions for the DataGrid
  const columns = useMemo(() => [
    {
      field: "ticker_symbol",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Ticker"}</Typography>
      ),
      flex: 1,
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
      type: "dateTime",
    },
  ], []);

  // fetchData - Fetches stock details and formats data for both chart and table.
  // - Data is updated periodically with an interval of 30 seconds.
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/stocks/${ticker}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.status === 401 ) {
        // Unauthorized, redirect to login page
        navigate("/login");
        return;
      }
      const data = await response.json();
      
      // Format data for the chart
      const chart_data = data
        .map((stock) => ({
          timestamp_end: formatDateChart(stock.timestamp_end),
          open: formatCurrencyChart(stock.open_price),
          high: formatCurrencyChart(stock.highest_price),
          low: formatCurrencyChart(stock.lowest_price),
          close: formatCurrencyChart(stock.close_price),
        }))
        .filter((stock) => stock.timestamp_end)
        .sort((a, b) => b.timestamp_end - a.timestamp_end);

      // Format data for the DataGrid
      const formattedData = data.map((stock, index) => ({
        id: index,
        ticker_symbol: stock.ticker_symbol,
        open_price: formatCurrency(stock.open_price),
        close_price: formatCurrency(stock.close_price),
        highest_price: formatCurrency(stock.highest_price),
        lowest_price: formatCurrency(stock.lowest_price),
        timestamp_end: formatDate(stock.timestamp_end),
      }));
      // Combine state updates
      setStockData({
        details: formattedData,
        chartData: chart_data,
      });
    } catch (error) {
      console.error("Error fetching Stocks data:", error);
    } finally {
      setLoading(false);
    }
  }, [ticker, navigate]);

  // Set interval to refetch data every 30 seconds
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return (
    <Box m="20px">
      <Header title="Stock Details" subtitle={`Full OHLC Data for ${ticker}`} />

      {/* ECharts Candlestick Chart */}
      <ReactECharts
        option={options}
        style={{ height: "500px", width: "100%" }}
      />
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
        
        {/* DataGrid */}
        <DataGrid
          rows={stockData.details}
          columns={columns}
          loading={loading}
          initialState={{
            sorting: {
              sortModel: [{ field: "timestamp_end", sort: "desc" }],
            },
          }}
      />
      </Box>
    </Box>
  );
};

export default Stocks;
