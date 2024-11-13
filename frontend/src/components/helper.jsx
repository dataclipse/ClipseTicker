// src/components/helper.jsx
import React from "react";
import { Box } from "@mui/material";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import { z } from "zod";

// Simple Zod schema to validate that dates are strings
const dateSchema = z.object({
  start_date: z.string(),
  end_date: z.string()
});

export const validateDateRange = (start, end, setError, allowFutureDates = false) => {
  try {
      dateSchema.parse({ start_date: start, end_date: end });
      const today = new Date();
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (allowFutureDates) {
          if (startDate < today) setError("Start date must be today or in the future.");
          if (endDate < today && end !== '') setError("End date must be today or in the future.");
      } else {
          if (startDate >= today) setError("Start date must be before today.");
          if (endDate >= today) setError("End date must be before today.");
      }

      if (startDate > endDate) {
          setError("Start date must be before or equal to the end date.");
          return false;
      }

      setError(""); // Clear error if validation passes
      return true;
  } catch (error) {
      setError("Invalid date format.");
      return false;
  }
};

export const updateFormState = (setFormState, field, value) => {
  setFormState(prevState => ({
      ...prevState,
      [field]: value,
  }));
};

export const calculateDataFetchDates = (dataFetchType, updateFormState) => {
  const today = new Date();
  let startDate, endDate;

  endDate = new Date(today);
  endDate.setDate(today.getDate() - 1); // Subtract 1 day from today's date

  if (dataFetchType === "2yrs_data") {
      startDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
      startDate.setDate(startDate.getDate() + 1);
      updateFormState('dataFetchStartDate', startDate.toISOString().split('T')[0]);
      updateFormState('dataFetchEndDate', endDate.toISOString().split('T')[0]);
  } else if (dataFetchType === "2wk_data") {
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 15);
      updateFormState('dataFetchStartDate', startDate.toISOString().split('T')[0]);
      updateFormState('dataFetchEndDate', endDate.toISOString().split('T')[0]);
  }
};

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
