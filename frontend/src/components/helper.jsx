import React from "react";
import { Box } from "@mui/material";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";

export const formatRunTime = (run_time) => {
    const parts = run_time.split(" ").filter(part => part); 
    let formatted = [];

    parts.forEach(part => {
        if (part.includes("h")) {
            if (part[0] !== '0') {
                formatted.push(part.replace("h", "h"));
            }
        } else if (part.includes("m")) {
            if (part[0] !== '0') {
                formatted.push(part.replace("m", "m"));
            } else {
                formatted.push("0");
            }
        } else if (part.includes("s")) {
            formatted.push(part.replace(/(\.\d+)?s/, "s"));
        }
    });

    return formatted.join(" ");
};

export const QuickSearchToolbar = () => (
    <Box sx={{ p: 0.5, pb: 0 }}>
        <GridToolbarQuickFilter />
    </Box>
);

export const formatCurrency = (value) => `$${parseFloat(value).toFixed(2)}`;

export const formatCurrencyChart = (value) => parseFloat(value).toFixed(2);

export const formatDate = (unix_timestamp) => {
    const timestamp = unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;
    const date = new Date(timestamp);
    return date;
};

export const formatDateChart = (unix_timestamp) => {
    const timestamp = unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;
    return new Date(timestamp);
};