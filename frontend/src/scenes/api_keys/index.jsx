import { Box, useTheme, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import React, { useState, useEffect, useCallback } from "react";
import Header from "../../components/header";

const ApiKeys = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);

    const columns = [
        { 
            field: "service", 
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Service'}</Typography>,
            flex: 1.5,
        },
        {
            field: "api_key", 
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'API Key'}</Typography>,
            flex: 1,
        },
        {
            field: "created_at",
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Created'}</Typography>,
            flex: 1,
        },
        { 
            field: "updated_at",
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Updated'}</Typography>,
            flex: 1,
        },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/api/keys");
                const data = await response.json();
                const formattedData = data.map((api, index) => ({
                    id: index, 
                    service: api.service,
                    api_key: api.api_key,
                    created_at: api.created_at,
                    updated_at: api.updated_at,
                }));
                setApiKeys(formattedData);
            } catch (error) {
                console.error("Error fetching Jobs data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    return (
        <Box m="20px" >
            <Header title="API Keys" subtitle="API Keys for Data Providers" />
            <Box
                m="40px 0 0 0"s
                height="75vh"
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
                    "& .MuiPaginationItem-root": {
                        borderTop: "none",
                        backgroundColor: `${colors.blueAccent[700]} !important`,
                    },
                }}
            >
                <DataGrid 
                    rows={apiKeys} 
                    columns={columns}
                    loading={loading}
                />
            </Box>
        </Box>
    );
};

export default ApiKeys;