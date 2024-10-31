import { Box, useTheme, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import { useParams } from "react-router-dom";
import ReactECharts from 'echarts-for-react';

const Stocks = () => {
    const { ticker } = useParams();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [stockDetails, setStockDetails] = useState([]);
    const [stockDetailsChartData, setStockDetailsChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Formatting functions
    const formatCurrency = (value) => `$${parseFloat(value).toFixed(2)}`;
    const format_date = (unix_timestamp) => {
        const timestamp = unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;
        const date = new Date(timestamp);
        return date
    };

    const format_date_for_chart = (unix_timestamp) => {
        const timestamp = unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;
        return new Date(timestamp);
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
                // Create an array for stock data
                const chart_data = data.map(stock => ({
                    timestamp_end: format_date_for_chart(stock.timestamp_end),
                    open: stock.open_price,
                    high: stock.highest_price, 
                    low: stock.lowest_price,
                    close: stock.close_price
                }))
                .filter(stock => stock.timestamp_end)
                .sort((a, b) => b.timestamp_end - a.timestamp_end);
                
                // Format the data for the DataGrid
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
                setStockDetailsChartData(chart_data);
            } catch (error) {
                console.error("Error fetching Stocks data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [ticker]);


    
    // Set up echarts options
    const get_option = () => {
        return {
            title: {
                text: `Candlestick Chart for ${ticker}`,
                left: 'left',
                textStyle: { color: colors.grey[100] },
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    backgroundColor: colors.primary[500],
                    color: colors.grey[100] 
                },
                backgroundColor: colors.primary[500], 
                textStyle: {
                    color: colors.grey[100] 
                },
                borderColor: colors.grey[700], 
                borderWidth: 1
            },
            grid: {
                left: '0%',
                right: '2%',
                bottom: '5%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: stockDetailsChartData.map(stock => stock.timestamp_end.toLocaleString()),
                axisLine: {
                    lineStyle: {
                        color: colors.grey[100] 
                    }
                },
                splitLine: { show: false },
                scale: true,
                boundaryGap: false,
                inverse: true,
                axisPointer: {
                    label: {
                        backgroundColor: colors.primary[500], 
                        color: colors.grey[100],
                        borderColor: colors.grey[700], 
                        borderWidth: 1            
                    }
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: colors.grey[100] 
                    },
                },
                splitLine: {
                    lineStyle: {
                        color: colors.grey[700],
                    }
                },
                scale: true,
                axisPointer: {
                    label: {
                        backgroundColor: colors.primary[500], 
                        color: colors.grey[100],
                        borderColor: colors.grey[700], 
                        borderWidth: 1            
                    }
                }
            },
            dataZoom: [
                {
                    type: 'slider',    
                    xAxisIndex: 0,     
                    start: 0,          
                    end: 100,          
                    handleSize: '80%', 
                    height: 5,        
                    bottom: 5,        
                    textStyle: {
                        color: colors.grey[100] 
                    }
                },
                {
                    type: 'inside',    
                    xAxisIndex: 0,
                    start: 0,
                    end: 100
                }
            ],
            series: [{
                type: 'candlestick',
                name: ticker,
                data: stockDetailsChartData.map(stock => [stock.open, stock.close, stock.low, stock.high]),
                itemStyle: {
                    color: colors.redAccent[500], 
                    color0: colors.greenAccent[700], 
                    borderColor: colors.greenAccent[700],
                    borderColor0: colors.redAccent[500],
                },
                emphasis: {
                    itemStyle: {
                        color: colors.redAccent[500],
                        color0: colors.greenAccent[700],
                    }
                }
            }],
            backgroundColor: colors.primary[500],
        };
    };


    return (
        <Box m="20px">
            <Header title="Stock Details" subtitle={`Full OHLC Data for ${ticker}`} />
            {/* ECharts Candlestick Chart */}
            <ReactECharts option={get_option()} style={{ height: '500px', width: '100%' }} />
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
                {/* DataGrid */}   
                <DataGrid 
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