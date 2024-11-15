// /src/scenes/stocks/stock_screener/index.jsx
import { Box, useTheme, Typography, Stack } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../../theme";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "../../../components/header";
import { Link, useNavigate } from "react-router-dom";
import {
    QuickSearchToolbar,
    formatCurrency,
    formatDateLocal,
    formatPE,
} from "../../../components/helper";

// Stocks Component - Displays the latest stock scrapes data in a DataGrid format
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
                        to={`/stock_details/stock_screener/${params.value}`}
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


    // Fetch data from /api/stock_scrapes
    const fetchData = useCallback(async () => {
        setLoading(true); // Set loading to true before fetching
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch("/api/stock_scrapes", {
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
                company_name: stock.company_name,
                price: formatCurrency(stock.price),
                change: stock.change,
                industry: stock.industry,
                volume: stock.volume.toLocaleString(),
                pe_ratio: formatPE(stock.pe_ratio),
                timestamp: formatDateLocal(stock.timestamp),
            }));
            setStocksData(formattedData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching stock scrapes data:", error);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    return (
        <Box m="20px">
            <Header title="NYSE" subtitle="Most Recent Scraped Screener Data" />
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
