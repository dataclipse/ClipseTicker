// src/scenes/stock_details/index.jsx
import { Box, useTheme, Typography, Stack, ButtonGroup, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../../theme";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "../../../components/header";
import { useParams, useNavigate } from "react-router-dom";
import { formatCurrency, formatDateLocal, formatPE } from "../../../components/helper";
import { ScreenerLine } from '../../../components/screener_line';

// Stocks Component - Displays detailed stock information for a selected ticker.
const Stocks = () => {
    const { ticker } = useParams();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState({ details: [], chartData: [] });
    const [timeRange, setTimeRange] = useState('1D');

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
            field: "company_name",
            renderHeader: () => (
                <Typography sx={{ fontWeight: "bold" }}>{"Company Name"}</Typography>
            ),
            flex: 1,
        },
        {
            field: "price",
            renderHeader: () => (
                <Typography sx={{ fontWeight: "bold" }}>{"Price"}</Typography>
            ),
            align: "right",
            headerAlign: "right",
            flex: 1,
        },
        {
            field: "change",
            renderHeader: () => (
                <Typography sx={{ fontWeight: "bold" }}>{"Change"}</Typography>
            ),
            align: "right",
            headerAlign: "right",
            flex: 1,
            renderCell: (params) => (
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems={"center"}
                    justifyContent={"flex-end"}
                    height={"100%"}
                >
                    <Typography
                        sx={{
                            fontWeight: "bold",
                            color: params.value < 0 ? colors.redAccent[500] : colors.greenAccent[500],
                        }}
                    >
                        {params.value}%
                    </Typography>
                </Stack>
            ),
        },
        {
            field: "industry",
            renderHeader: () => (
                <Typography sx={{ fontWeight: "bold" }}>{"Industry"}</Typography>
            ),
            flex: 1,
        },
        {
            field: "volume",
            renderHeader: () => (
                <Typography sx={{ fontWeight: "bold" }}>{"Volume"}</Typography>
            ),
            align: "right",
            headerAlign: "right",
            flex: 1,
        },
        {
            field: "pe_ratio",
            renderHeader: () => (
                <Typography sx={{ fontWeight: "bold" }}>{"P/E Ratio"}</Typography>
            ),
            align: "right",
            headerAlign: "right",
            flex: 1,
        },
        {
            field: "timestamp",
            renderHeader: () => (
                <Typography sx={{ fontWeight: "bold" }}>{"Date"}</Typography>
            ),
            flex: 1,
            renderCell: (params) => {
                const date = params.value;
                const hours = date.getHours();
                const minutes = date.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const formattedTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                return (
                    <Stack
                        direction="row"
                        alignItems={"center"}
                        justifyContent={'left'}
                        height={"100%"}
                    >
                        <Typography sx={{ mt: .1, fontSize: 12 }}>
                            {date.toLocaleDateString()} {formattedTime}
                        </Typography>
                    </Stack>
                );
            },
        },
    ], [colors]);

    // fetchData - Fetches stock details and formats data for both chart and table.
    // - Data is updated periodically with an interval of 30 seconds.
    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`/api/stock_scrapes/${ticker}`, {
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
                    time: stock.timestamp,
                    price: stock.price,
                    ticker_symbol: stock.ticker_symbol
                }))
                .filter((stock) => stock.time)
                .sort((a, b) => b.time - a.time);


            // Format data for the DataGrid
            const formattedData = data.map((stock, index) => ({
                id: index,
                ticker_symbol: stock.ticker_symbol,
                company_name: stock.company_name,
                price: formatCurrency(stock.price),
                change: stock.change,
                industry: stock.industry,
                volume: stock.volume.toLocaleString(),
                pe_ratio: formatPE(stock.pe_ratio),
                timestamp: formatDateLocal(stock.timestamp),
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

    // Filter the chartData based on the button that is pressed
    const getFilteredChartData = useCallback(() => {
        const now = new Date();
        const data = [...stockData.chartData];

        // Ensure the data is sorted in chronological order (oldest to newest) based on the `time` property.
        data.sort((a, b) => new Date(a.time) - new Date(b.time));

        // Use a switch statement to filter the data based on the selected `timeRange`.
        switch (timeRange) {
            case '1D':
                const oneDayAgo = new Date(now.setDate(now.getDate() - 1));
                return data.filter(item => new Date(item.time) >= oneDayAgo);
            case '5D':
                const fiveDaysAgo = new Date(now.setDate(now.getDate() - 5));
                return data.filter(item => new Date(item.time) >= fiveDaysAgo);
            case '1M':
                const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
                return data.filter(item => new Date(item.time) >= oneMonthAgo);
            case 'YTD':
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                return data.filter(item => new Date(item.time) >= startOfYear);
            case '1Y':
                const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
                return data.filter(item => new Date(item.time) >= oneYearAgo);
            default:
                return data;
        }
    }, [timeRange, stockData.chartData]);

    return (
        <Box m="20px">
            <Header title="Stock Details" subtitle={`Full Stock Screener Data for ${ticker} polled ~every minute`} />

            <Box mb={2}>
                <ButtonGroup variant="contained" sx={{ ml: 6.1 }}>
                    {['1D', '5D', '1M', 'YTD', '1Y'].map((range) => (
                        <Button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            sx={{
                                backgroundColor: timeRange === range ? colors.blueAccent[700] : colors.blueAccent[800],
                                '&:hover': {
                                    backgroundColor: colors.blueAccent[600],
                                }
                            }}
                        >
                            {range}
                        </Button>
                    ))}
                </ButtonGroup>
            </Box>

            <ScreenerLine data={getFilteredChartData()} colors={colors} />
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
                            sortModel: [{ field: "timestamp", sort: "desc" }],
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default Stocks;
