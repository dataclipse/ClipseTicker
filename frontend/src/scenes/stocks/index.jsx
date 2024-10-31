import { Box, useTheme, Typography, Stack } from "@mui/material";
import { DataGrid, GridToolbarQuickFilter  } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate } from "../../components/helper";

const Stocks = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [stocksData, setStocksData] = useState([]);
    const [loading, setLoading] = useState(true);

    const columns = [
        { field: "ticker_symbol", renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Ticker'}</Typography>, renderCell: (params) => (
            <Stack direction="row" spacing={1} alignItems={'center'} height={'100%'}>
                <Link to={`/stocks/${params.value}`} style={{ textDecoration: 'none', color: colors.greenAccent[500], mx: '0.5' }}>
                    <Typography sx={{ fontWeight: 'bold', mx: '0.5'}}>{params.value}</Typography>
                </Link>
            </Stack>
        )},
        { field: "open_price", renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Open Price'}</Typography>, align: "right", headerAlign: "right", flex: 1 },
        { field: "highest_price", renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Highest Price'}</Typography>, align: "right", headerAlign: "right", flex: 1 },
        { field: "lowest_price", renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Lowest Price'}</Typography>, align: "right", headerAlign: "right", flex: 1 },
        { field: "close_price", renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Close Price'}</Typography>, align: "right", headerAlign: "right", flex: 1 },
        { field: "timestamp_end", renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Date'}</Typography>, flex: 1 }
    ];

    const fetchData = async () => {
        try {
            const response = await fetch("/api/stocks");
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
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 10000);
        return () => clearInterval(intervalId);
    }, []);


    function QuickSearchToolbar() {
        return (
            <Box
                sx={{
                p: 0.5,
                pb: 0,
                }}
            >
                <GridToolbarQuickFilter />
            </Box>
        );
    }

    return (
        <Box m="20px">
            <Header title="NYSE" subtitle="Most Recent OHLC Data" />
            <Box
                m="40px 0 0 0"
                display="flex"
                height={'75vh'}
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