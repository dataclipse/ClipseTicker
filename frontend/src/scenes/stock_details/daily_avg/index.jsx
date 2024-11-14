// src/scenes/stock_details/index.jsx
import { Box, useTheme, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../../theme";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Header from "../../../components/header";
import { useParams, useNavigate } from "react-router-dom";
import { formatCurrency, formatDate, convertTimestamp } from "../../../components/helper";
import { createChart } from 'lightweight-charts';

// Stocks Component - Displays detailed stock information for a selected ticker.
// - Shows stock data in both a candlestick chart and a data grid.
const Stocks = () => {
  const { ticker } = useParams();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState({ details: [], chartData: [] });
  const chartContainerRef = useRef();

  useEffect(() => {
    try {
      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      };
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: {
            color: colors.primary[500]
          },
          attributionLogo: false,
          textColor: colors.grey[100],
        },
        grid: {
          vertLines: { color: colors.grey[700] },
          horzLines: { color: colors.grey[700] }
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: colors.greenAccent[500],
        downColor: colors.redAccent[500],
        borderUpColor: colors.greenAccent[500],
        borderDownColor: colors.redAccent[500],
        wickUpColor: colors.greenAccent[500],
        wickDownColor: colors.redAccent[500],
        borderColor: colors.grey[500],
      })
      const sortedChartData = stockData.chartData.sort((a, b) => a.time - b.time);
      candlestickSeries.setData(sortedChartData);
      candlestickSeries.priceScale().applyOptions({
        autoScale: true, // disables auto scaling based on visible content
        scaleMargins: {
          top: 0.1,
          bottom: .6,
        },
        textColor: colors.grey[100],
        borderColor: colors.grey[700],
      });

      // Get the current users primary locale
      const currentLocale = window.navigator.languages[0];

      // Create a number format using Intl.NumberFormat
      const myPriceFormatter = Intl.NumberFormat(currentLocale, {
        style: "currency",
        currency: "USD", // Currency for data points
        currencyDisplay: "symbol",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format;

      const customPriceFormatter = (value) => {
        const formattedValue = myPriceFormatter(value);
        return formattedValue.replace(/([^\d.,]+)(\d)/, '$1 $2');
      };

      // Apply the custom priceFormatter to the chart
      chart.applyOptions({
        localization: {
          priceFormatter: customPriceFormatter,
        },
      });

      // Setting the border color for the horizontal axis
      chart.timeScale().applyOptions({
        borderColor: colors.grey[700],
        textColor: colors.grey[100],
        timeVisible: true,
        secondsVisible: false,
        visible: true,
        barSpacing: 20,
      });

      chart.timeScale().fitContent();

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      }
    } catch (error) {
      console.error(error);
    }
  }, [colors, stockData.chartData]);

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
      if (response.status === 401) {
        // Unauthorized, redirect to login page
        navigate("/login");
        return;
      }
      const data = await response.json();

      // Format data for the chart
      const chart_data = data
        .map((stock) => ({
          time: convertTimestamp(stock.timestamp_end),
          open: stock.open_price,
          high: stock.highest_price,
          low: stock.lowest_price,
          close: stock.close_price,
        }))
      console.log(chart_data)
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
    try{
      fetchData();
      const intervalId = setInterval(fetchData, 30000);
      return () => clearInterval(intervalId);
    } catch (error) {
      console.error(error);
    }
  }, [fetchData]);

  return (
    <Box m="20px">
      <Header title="Stock Details" subtitle={`Full OHLC Data for ${ticker}`} />
      <div ref={chartContainerRef}></div>
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
