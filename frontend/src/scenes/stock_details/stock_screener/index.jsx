// src/scenes/stock_details/index.jsx
import { Box, useTheme, Typography, Stack, ButtonGroup, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { tokens } from '../../../theme';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '../../../components/header';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency, formatPE } from '../../../components/helper';
import ScreenerLine from '../../../components/screener_line';
import moment from 'moment';

// Stocks Component - Displays detailed stock information for a selected ticker.
const Stocks = () => {
    const { ticker } = useParams();
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const [state, setState] = useState({
        loading: true,
        error: null,
        details: [],
        chartData: []
    });
    const [timeRange, setTimeRange] = useState('1D');

    // Column definitions for the DataGrid
    const columns = useMemo(() => [
        {
            field: 'ticker_symbol',
            renderHeader: () => (
                <Typography sx={{ fontWeight: 'bold' }}>{'Ticker'}</Typography>
            ),
            flex: 1,
        },
        {
            field: 'company_name',
            renderHeader: () => (
                <Typography sx={{ fontWeight: 'bold' }}>{'Company Name'}</Typography>
            ),
            flex: 1,
        },
        {
            field: 'price',
            renderHeader: () => (
                <Typography sx={{ fontWeight: 'bold' }}>{'Price'}</Typography>
            ),
            align: 'right',
            headerAlign: 'right',
            flex: 1,
        },
        {
            field: 'change',
            renderHeader: () => (
                <Typography sx={{ fontWeight: 'bold' }}>{'Change'}</Typography>
            ),
            align: 'right',
            headerAlign: 'right',
            flex: 1,
            renderCell: (params) => (
                <Stack
                    direction='row'
                    spacing={1}
                    alignItems={'center'}
                    justifyContent={'flex-end'}
                    height={'100%'}
                >
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            color: params.value < 0 ? colors.redAccent[500] : colors.greenAccent[500],
                        }}
                    >
                        {params.value}%
                    </Typography>
                </Stack>
            ),
        },
        {
            field: 'industry',
            renderHeader: () => (
                <Typography sx={{ fontWeight: 'bold' }}>{'Industry'}</Typography>
            ),
            flex: 1,
        },
        {
            field: 'volume',
            renderHeader: () => (
                <Typography sx={{ fontWeight: 'bold' }}>{'Volume'}</Typography>
            ),
            align: 'right',
            headerAlign: 'right',
            flex: 1,
        },
        {
            field: 'pe_ratio',
            renderHeader: () => (
                <Typography sx={{ fontWeight: 'bold' }}>{'P/E Ratio'}</Typography>
            ),
            align: 'right',
            headerAlign: 'right',
            flex: 1,
        },
        {
            field: 'timestamp',
            renderHeader: () => (
                <Typography sx={{ fontWeight: 'bold' }}>{'Date'}</Typography>
            ),
            flex: 1,
            renderCell: (params) => (
                <Stack
                    direction='row'
                    spacing={1}
                    alignItems={'center'}
                    height={'100%'}
                >
                    <Typography sx={{ fontSize: 12 }}>
                        {moment(params.value).local().format('MM/DD/YYYY hh:mm:ss A')}
                    </Typography>
                </Stack>
            ),
        },
    ], [colors]);
    
    // Format the data for the DataGrid
    const formattedGridData = useMemo(() => {
        if (!state.details || state.details.length === 0) return [];
        
        return state.details.map((stock, index) => ({
            id: index,
            ticker_symbol: stock.ticker_symbol,
            company_name: stock.company_name || 'N/A',
            price: formatCurrency(stock.price),
            change: stock.change, 
            industry: stock.industry || 'N/A',
            volume: stock.volume ? stock.volume.toLocaleString() : 'N/A',
            pe_ratio: stock.pe_ratio ? formatPE(stock.pe_ratio) : 'N/A',
            timestamp: moment(stock.timestamp).format('MM/DD/YYYY HH:mm:ss')
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [state.details]);
        
    // Filter the chartData based on the button that is pressed
    const filteredChartData = useMemo(() => {
        const data = [...state.chartData];

        // Ensure the data is sorted in chronological order (oldest to newest) based on the `time` property.
        data.sort((a, b) => moment(a.time).valueOf() - moment(b.time).valueOf());

        // Use a switch statement to filter the data based on the selected `timeRange`.
        switch (timeRange) {
            case '1D':
                // Function to get data for a specific day
                const getDayData = (date) => {
                    const startOfDay = moment(date).startOf('day');
                    const endOfDay = moment(date).endOf('day');
                    return data.filter(item =>
                        moment(item.time).isBetween(startOfDay, endOfDay, undefined, '[]')
                    );
                };
                
                // Try to get today's data
                const today = moment();
                let filteredData = getDayData(today);

                // If no data for today, keep checking previous days until we find data
                let currentDate1D = today;
                const twoWeeksAgo1D = moment().subtract(14, 'days');
                while (filteredData.length === 0 && currentDate1D.isAfter(twoWeeksAgo1D)) {
                    currentDate1D = currentDate1D.subtract(1, 'days');
                    filteredData = getDayData(currentDate1D);
                }
                return filteredData;
            case '5D':
                const twoWeeksAgo5D = moment().subtract(14, 'days');
                let businessDaysFound = 0;
                let currentDate5D = moment();

                // Find the date that gives us 5 business days
                while (businessDaysFound < 5 && currentDate5D.isAfter(twoWeeksAgo5D)) {
                    // Check if it's a business day (not weekend)
                    if (currentDate5D.day() !== 0 && currentDate5D.day() !== 6) {
                        businessDaysFound++;
                    }
                    if (businessDaysFound < 5) {
                        currentDate5D.subtract(1, 'days');
                    }
                }

                // Filter data between the found date and now
                return data.filter(item => 
                    moment(item.time).isBetween(currentDate5D, moment(), undefined, '[]')
                );
            case '1M':
                const oneMonthAgo = moment().subtract(1, 'month');
                return data.filter(item => moment(item.time).isAfter(oneMonthAgo));
            case 'YTD':
                const startOfYear = moment().startOf('year');
                return data.filter(item => moment(item.time).isAfter(startOfYear));
            case '1Y':
                const oneYearAgo = moment().subtract(1, 'year');
                return data.filter(item => moment(item.time).isAfter(oneYearAgo));
            default:
                return data;
        }
    }, [state.chartData, timeRange]);

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/stock_scrapes/${ticker}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.status === 401) {
                navigate('/login');
                return;
            }
            
            const data = await response.json();
            const chart_data = data
                .map((stock) => ({
                    time: stock.timestamp,
                    price: stock.price,
                    ticker_symbol: stock.ticker_symbol
                }))
                .filter((stock) => stock.time)
                .sort((a, b) => b.time - a.time);

            setState(prev => ({
                ...prev,
                loading: false,
                error: null,
                details: data,
                chartData: chart_data
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to fetch stock data. Please try again later.'
            }));
        }
    }, [ticker, navigate]);

    // Set interval to refetch data every 30 seconds
    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 30000);
        return () => clearInterval(intervalId);
    }, [fetchData]);


    return (
        <Box display='flex'flexDirection='column'width='100%'height='100%'sx={{ backgroundColor:colors.primary[500], position:'relative'}} >   
            <Box sx={{ m:'20px'}}>
                <Header title='Stock Details' subtitle={`Full Stock Screener Data for ${ticker} polled ~every 5 minutes`} />
            </Box>
            
            {/* Top section with two columns */}
            <Box display='flex'width='100%' height='70%'sx={{position:'relative', mb:2}} >
                {/* Left side vertical divider */}
                <Box width='2px' height='100%' sx={{backgroundColor:colors.grey[300], position:'absolute', left:'40%', transform:'translateX(-40%)', zIndex:10}} />
                
                
                {/* Left side */}
                <Stack width='40%' height='100%' sx={{display:'flex', flexDirection:'column', padding:2}} >
                    <Box sx={{ display: 'flex' }} >

                        {/* Column 1 */}
                        <Box sx={{ flex: 1, mr: 2 }} >
                            <Box sx={{ mb: 2 }} >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Market Cap
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mb: 1, mt: -1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Revenue (ttm)
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Net Income (ttm)	
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Shares Out	
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        EPS (ttm)
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        PE Ratio
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Forward PE
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Dividend
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Ex-Dividend Date
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                        </Box>
                        
                        {/* Column 2 */}
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ mb: 2 }} >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Volume
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mb: 1, mt: -1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Open
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Previous Close	
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Day's Range
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        52-Week Range
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Beta
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Analysts
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Price Target
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" color={colors.grey[300]} sx={{ textAlign: 'left' }}>
                                        Earnings Date
                                    </Typography>
                                    <Typography variant="h5" color={colors.greenAccent[500]} sx={{ textAlign: 'right' }}>
                                        XX.XX
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ height: '1px', backgroundColor: colors.grey[300], opacity: 0.2, mt: 1, mb: 1 }} />
                        </Box>
                        
                    </Box>
                </Stack>

                {/* Right side (buttons and graph) */}
                <Box width='60%' height='100%' sx={{display:'flex', flexDirection:'column'}} >
                    {/* Time range buttons */}
                    <Box sx={{width:'100%', display:'flex', justifyContent:'left'}} >
                        <ButtonGroup variant='text' sx={{ml:2, '& .MuiButtonGroup-grouped':{borderColor: colors.primary[400]}}} >
                            {Object.entries({
                                '1D': '1 Day', 
                                '5D': '5 Days',
                                '1M': '1 Month',
                                'YTD': 'YTD',
                                '1Y': '1 Year'
                            }).map(([range, displayText]) => (
                                <Button key={range} onClick={() => setTimeRange(range)} sx={{color:range===timeRange?colors.greenAccent[500]:colors.grey[300], fontSize:'15px',}} >
                                    {displayText}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </Box>
                    {/* Stock chart */}
                    <Box sx={{flexGrow:1, height:'100%', width:'112%',mb:-8,ml:-5}} >
                        <ScreenerLine data={filteredChartData} colors={colors} />
                    </Box>
                </Box>
            </Box>
            
            {/* DataGrid */}
            <Box 
                sx={{ 
                    flexGrow: 1, 
                    height: '70%', 
                    width: '99.9%', 
                    px: 2, 
                    '& .MuiDataGrid-root': {
                        border: 'none',
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: 'none',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: colors.blueAccent[700],
                        borderBottom: 'none',
                        fontWeight: 'bold',
                    },
                    '& .MuiDataGrid-virtualScroller': {
                        backgroundColor: colors.primary[400],
                    },
                    '& .MuiCircularProgress-root': {
                        color: colors.greenAccent[500],
                    },
                    '& .MuiPaginationItem-root': {
                        borderTop: 'none',
                        backgroundColor: `${colors.blueAccent[700]} !important`,
                    },
                }}
            >
                <DataGrid
                    rows={formattedGridData}
                    columns={columns}
                    loading={state.loading}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'timestamp', sort: 'desc' }],
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default Stocks;
