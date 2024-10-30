import { Box, useTheme, Typography } from "@mui/material";
import { DataGrid, GridToolbarQuickFilter  } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import { useParams } from "react-router-dom";

const Stocks = ({ }) => {
    const { ticker } = useParams();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [stockDetails, setStockDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (value) => `$${parseFloat(value).toFixed(2)}`;
    const format_date = (unix_timestamp) => {
        const timestamp = unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;
        const date = new Date(timestamp);
        return date
    };

    const columns = [
        { 
            field: "ticker_symbol", 
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Ticker'}</Typography>,
            flex: 1,
        },
        {
            field: "open_price", 
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Open Price'}</Typography>,
            align: "right",
            headerAlign: "right",
            flex: 1,
        },
        {
            field: "highest_price",
            headerName: "Highest Price",
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Highest Price'}</Typography>,
            align: "right",
            headerAlign: "right",
            flex: 1,
        },
        { 
            field: "lowest_price",
            headerName: "Lowest Price",
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Lowest Price'}</Typography>,
            align: "right",
            headerAlign: "right",
            flex: 1,
        },
        {
            field: "close_price",
            headerName: "Close Price",
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Close Price'}</Typography>,
            align: "right",
            headerAlign: "right",
            flex: 1,
        },
        {
            field: "timestamp_end",
            headerName: "Date",
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Date'}</Typography>,
            flex: 1,
            type: 'dateTime',
        },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/stocks/${ticker}`);
                const data = await response.json();
                const formattedData = data.map((stock, index) => ({
                    id: index, 
                    ticker_symbol: stock.ticker_symbol,
                    open_price: formatCurrency(stock.open_price),
                    close_price: formatCurrency(stock.close_price),
                    highest_price: formatCurrency(stock.highest_price),
                    lowest_price: formatCurrency(stock.lowest_price),
                    timestamp_end: format_date(stock.timestamp_end),
                }));
                setStockDetails(formattedData);
            } catch (error) {
                console.error("Error fetching Stocks data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [ticker]);

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
            <Header title="Stock Details" subtitle="OHLC Data for" />
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
                        toolbarQuickFilterPlaceholder: "Search...",
                    }}
                    slots={{ toolbar: QuickSearchToolbar }}
                    rows={stockDetails} 
                    columns={columns}
                    loading={loading}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'timestamp_end', sort: 'desc' }],
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default Stocks;