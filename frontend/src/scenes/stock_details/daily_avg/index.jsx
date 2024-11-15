// src/scenes/stock_details/index.jsx
import { Box, useTheme, Typography, Button, ButtonGroup, Stack } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../../theme";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "../../../components/header";
import { useParams, useNavigate } from "react-router-dom";
import { formatCurrency, formatDate, formatDateChart } from "../../../components/helper";
import CandlestickChart from '../../../components/candlestick';


// Stocks Component - Displays detailed stock information for a selected ticker.
// - Shows stock data in both a candlestick chart and a data grid.
const Stocks = () => {
  const { ticker } = useParams();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState({ details: [], chartData: [] });
  const [filteredChartData, setFilteredChartData] = useState(stockData.chartData);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('1m'); // Default to 1 month

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
      renderCell: (params) => {
        const date = params.value;
        return (
            <Stack
                direction="row"
                alignItems={"center"}
                height={"100%"}
            >
                <Typography sx={{ fontSize: 12 }}>
                    {date.toLocaleDateString()}
                </Typography>
            </Stack>
        );
      },
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
          time: formatDateChart(stock.timestamp_end),
          open: stock.open_price,
          high: stock.highest_price,
          low: stock.lowest_price,
          close: stock.close_price,
        }))

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
      // Set filteredChartData based on selectedTimeFrame
      const now = new Date();
      const filteredData = chart_data.filter((dataPoint) => {
        const dataDate = new Date(dataPoint.time);
        switch (selectedTimeFrame) {
          case '1w':
            return dataDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          case '1m':
            return dataDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          case 'YTD':
            return dataDate >= new Date(now.getFullYear(), 0, 1);
          case '1y':
            return dataDate >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          case '2y':
            return dataDate >= new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
          default:
            return true;
        }
      });
      setFilteredChartData(filteredData);
    } catch (error) {
      console.error("Error fetching Stocks data:", error);
    } finally {
      setLoading(false);
    }
  }, [ticker, navigate, selectedTimeFrame]);

  // Set interval to refetch data every 30 seconds
  useEffect(() => {
    try {
      fetchData();
      const intervalId = setInterval(fetchData, 30000);

      // Add event listener for window resize
      const handleResize = () => {
        fetchData(); // Reload graph data on resize
      };
      window.addEventListener('resize', handleResize);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('resize', handleResize); // Clean up listener
      };
    } catch (error) {
      console.error(error);
    }
  }, [fetchData]);

  // Function to filter chart data based on selected time frame
  const filterChartData = (timeFrame) => {
    setSelectedTimeFrame(timeFrame);
    const now = new Date();
    const filteredData = stockData.chartData.filter((dataPoint) => {
      const dataDate = new Date(dataPoint.time);
      switch (timeFrame) {
        case '1w':
          return dataDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        case '1m':
          return dataDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        case 'YTD':
          return dataDate >= new Date(now.getFullYear(), 0, 1);
        case '1y':
          return dataDate >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        case '2y':
          return dataDate >= new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        default:
          return true;
      }
    });
    setFilteredChartData(filteredData);
  };

  return (
    <Box m="20px">
      <Header title="Stock Details" subtitle={`Full OHLC Data for ${ticker}`} />

      {/* Replace the individual Buttons with ButtonGroup */}
      <Box mb={2}>
        <ButtonGroup variant="contained" sx={{ ml: 6.1 }}>
          {['1w', '1m', 'YTD', '1y', '2y'].map((range) => (
            <Button
              key={range}
              onClick={() => filterChartData(range)}
              sx={{
                backgroundColor: selectedTimeFrame === range ? colors.blueAccent[700] : colors.blueAccent[800],
                '&:hover': {
                  backgroundColor: colors.blueAccent[600],
                }
              }}
            >
              {range === '1w' ? '1 Week' :
                range === '1m' ? '1 Month' :
                  range === 'YTD' ? 'Year To Date' :
                    range === '1y' ? '1 Year' :
                      '2 Years'}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      <CandlestickChart data={filteredChartData} colors={colors} />
      <Box
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
