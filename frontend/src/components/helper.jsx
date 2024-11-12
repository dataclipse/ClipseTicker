// src/components/helper.jsx
import React from "react";
import { Box } from "@mui/material";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";

// Format run time string by removing leading zero values from each time part
export const formatRunTime = (run_time) => {
  // Return null if run_time is empty or null
  if (run_time == null) {
    return run_time;
  }

  // Split run time into parts by spaces and filter out empty parts
  const parts = run_time.split(" ").filter((part) => part);
  let formatted = [];

  // Process each part of the run time
  parts.forEach((part) => {
    if (part.includes("h")) {
      // Include hours only if it’s not zero
      if (part[0] !== "0") {
        formatted.push(part.replace("h", "h"));
      }
    } else if (part.includes("m")) {
      // Include minutes, but if it’s zero, push "0m"
      if (part[0] !== "0") {
        formatted.push(part.replace("m", "m"));
      } else {
        formatted.push("0m");
      }
    } else if (part.includes("s")) {
      // Include seconds, removing any decimal points
      formatted.push(part.replace(/(\.\d+)?s/, "s"));
    }
  });

  // Join formatted parts with spaces
  return formatted.join(" ");
};

// Toolbar component for quick search functionality in a data grid
export const QuickSearchToolbar = () => (
  <Box sx={{ p: 0.5, pb: 0 }}>
    <GridToolbarQuickFilter />
  </Box>
);

// Format a number as currency with two decimal places
export const formatCurrency = (value) => `$${parseFloat(value).toFixed(2)}`;

// Format a number as currency for charts without the dollar sign
export const formatCurrencyChart = (value) => parseFloat(value).toFixed(2);

// Format a Unix timestamp into a JavaScript Date object
export const formatDate = (unix_timestamp) => {
  // Convert Unix timestamp to milliseconds if it's less than 10 digits
  const timestamp =
    unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;
  const date = new Date(timestamp);
  return date;
};

// Format a Unix timestamp specifically for chart data
export const formatDateChart = (unix_timestamp) => {
  const timestamp =
    unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;
  return new Date(timestamp);
};
