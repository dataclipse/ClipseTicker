// src/scenes/stock_details/index.jsx
import { Box, useTheme, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import React, { useState, useEffect, useCallback } from "react";
import Header from "../../components/header";
import { useParams } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { getCandlestickChartOptions } from "../../components/echart_options";
import {
  formatCurrency,
  formatCurrencyChart,
  formatDate,
  formatDateChart,
} from "../../components/helper";

const Stocks = () => {
  const { ticker } = useParams();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [stockDetails, setStockDetails] = useState([]);
  const [stockDetailsChartData, setStockDetailsChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const options = getCandlestickChartOptions(
    ticker,
    stockDetailsChartData,
    colors
  );

  const columns = [
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
  ];

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${ticker}`);
      const data = await response.json();
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

      const formattedData = data.map((stock, index) => ({
        id: index,
        ticker_symbol: stock.ticker_symbol,
        open_price: formatCurrency(stock.open_price),
        close_price: formatCurrency(stock.close_price),
        highest_price: formatCurrency(stock.highest_price),
        lowest_price: formatCurrency(stock.lowest_price),
        timestamp_end: formatDate(stock.timestamp_end),
      }));
      setStockDetails(formattedData);
      setStockDetailsChartData(chart_data);
    } catch (error) {
      console.error("Error fetching Stocks data:", error);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

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
          rows={stockDetails}
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
