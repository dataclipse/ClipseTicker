import { Box, useTheme, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import React, { useState, useEffect, useCallback } from "react";
import Header from "../../components/header";

const Jobs = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [Jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatRunTime = (run_time) => {
        const parts = run_time.split(" ").filter(part => part); 
        let formatted = [];

        parts.forEach(part => {
            if (part.includes("h")) {
                if (part[0] !== '0') {
                    formatted.push(part.replace("h", "h")); // Keep hours if not 0
                }
            } else if (part.includes("m")) {
                if (part[0] !== '0') {
                    formatted.push(part.replace("m", "m")); // Keep minutes if not 0
                } else {
                    formatted.push("0"); // Include 0 minutes as "0"
                }
            } else if (part.includes("s")) {
                formatted.push(part.replace(/(\.\d+)?s/, "s")); // Remove decimals
            }
        });

        // Join the formatted parts and return
        return formatted.join(" ");
    };

    const columns = [
        { 
            field: "job_name", 
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Ticker'}</Typography>,
            flex: 1.5,
        },
        {
            field: "scheduled_start_time", 
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Scheduled Start Time'}</Typography>,
            flex: 1,
        },
        {
            field: "status",
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Status'}</Typography>,
            flex: 1,
        },
        { 
            field: "start_time",
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Start Time'}</Typography>,
            flex: 1,
        },
        {
            field: "end_time",
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'End Time'}</Typography>,
            flex: 1,
        },
        {
            field: "run_time",
            renderHeader: () => <Typography sx={{ fontWeight: 'bold' }}>{'Run Time'}</Typography>,
            flex: 1,
        },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/api/jobs");
                const data = await response.json();
                const formattedData = data.map((jobs, index) => ({
                    id: index, 
                    job_name: jobs.job_name,
                    scheduled_start_time: jobs.scheduled_start_time,
                    status: jobs.status,
                    start_time: jobs.start_time,
                    end_time: jobs.end_time,
                    run_time: formatRunTime(jobs.run_time),
                }));
                setJobs(formattedData);
            } catch (error) {
                console.error("Error fetching Jobs data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    return (
        <Box m="20px">
            <Header title="Data Fetch" subtitle="Status of Jobs to Fetch Stock Data" />
            <Box
                m="40px 0 0 0"
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
                    rows={Jobs} 
                    columns={columns}
                    loading={loading} 
                />
            </Box>
        </Box>
    );
};

export default Jobs;