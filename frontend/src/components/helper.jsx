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

const isBeforeToday = (date) => {
  const today = new Date();
  return date >= today;
};

export const validateDateRange = (start, end, setError, allowFutureDates = false) => {
  try {
      dateSchema.parse({ start_date: start, end_date: end });
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (allowFutureDates) {
        if (isBeforeToday(startDate)) setError("Start date must be today or in the future.");
        if (isBeforeToday(endDate) && end !== '') setError("End date must be today or in the future.");
    } else {
        if (!isBeforeToday(startDate)) setError("Start date must be before today.");
        if (!isBeforeToday(endDate)) setError("End date must be before today.");
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

export const updateFormState = (field, value, setStateFunction) => {
    if (typeof setStateFunction !== 'function') {
        console.error('setStateFunction is not a function:', setStateFunction);
        return;
    }
    
    setStateFunction(prevState => ({
        ...prevState,
        [field]: value
    }));
};

export const calculateDataFetchDates = (dataFetchType, updateFormState) => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 1); // Subtract 1 day from today's date

  const setDates = (startDate) => {
      updateFormState('dataFetchStartDate', startDate.toISOString().split('T')[0]);
      updateFormState('dataFetchEndDate', endDate.toISOString().split('T')[0]);
  };

  if (dataFetchType === "2yrs_data") {
      const startDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
      startDate.setDate(startDate.getDate() + 1);
      setDates(startDate);
  } else if (dataFetchType === "2wk_data") {
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 15);
      setDates(startDate);
  }
};

// Format run time string by removing leading zero values from each time part
export const formatRunTime = (run_time) => {
  if (!run_time) return run_time; // Return null if run_time is empty or null

  return run_time.split(" ").filter(part => part).map(part => {
    if (part.includes("h") && part[0] !== "0") return part;
    if (part.includes("m")) return part[0] !== "0" ? part : "0m";
    if (part.includes("s")) return part.replace(/(\.\d+)?s/, "s");
    return null;
  }).filter(Boolean).join(" ");
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

export const formatDateTimestamp = (unix_timestamp) => {
  // Convert Unix timestamp to milliseconds if it's less than 10 digits
  const timestamp =
    unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;
  return timestamp;
};

// Format a Unix timestamp specifically for chart data
export const formatDateChart = (unix_timestamp) => {
  const timestamp =
    unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;
  return new Date(timestamp);
};

// Converts UTC date string to local timezone string
export const convertToLocalTime = (utcDateString) => {
  if (!utcDateString) return "";
  const date = new Date(utcDateString);
  if (isNaN(date.getTime())) {
    return ""; // Return fallback if date parsing fails
  }
  return date.toLocaleString(); 
};

// Formats a string by replacing underscores and capitalizing words
export function formatString(inputString) {
  return inputString.replace(/_/g, ' ').toLowerCase().replace(/\b\w+\b/g, word => word === 'api' ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)); 
};

// Parses a JSON string of weekdays into a CSV format
export function parseWeekdays(weekdaysStr) {
  try {
    const weekdaysArray = JSON.parse(weekdaysStr); // Parse JSON string into an array
    return weekdaysArray.join(", "); // Convert array to CSV format
  } catch (error) {
    return weekdaysStr; // Return the original string if parsing fails
  }
}
// Format a Unix timestamp into a JavaScript Date object in the user's local timezone
// Format a Unix timestamp into a JavaScript Date object in the user's local timezone
export const formatDateLocal = (unix_timestamp) => {
  // Convert Unix timestamp to milliseconds if it's less than 10 digits
  const timestamp =
    unix_timestamp < 10000000000 ? unix_timestamp * 1000 : unix_timestamp;

  // Create a new Date object
  const date = new Date(timestamp);

  // Get the user's local timezone offset in minutes
  const tz_offset_minutes = date.getTimezoneOffset();

  // Create a new Date object in the user's local timezone
  const local_date = new Date(date.getTime() + tz_offset_minutes * 60 * 1000);
  
  // Convert the Date object to a string in the user's local timezone
  // return local_date.toLocaleString('default', {  
  //   year: 'numeric', 
  //   month: 'short', 
  //   day: '2-digit', 
  //   hour: '2-digit', 
  //   minute: '2-digit', 
  //   second: '2-digit', 
  //   hour12: true 
  // });
  return local_date
};

export function formatPE(value) {
  if (value === 0) return undefined;
  return parseFloat(value).toFixed(2);
};

export function convertTimestamp(timestamp){

  // Get the new timestamp without milliseconds
  const newTimestamp = Math.floor(timestamp / 1000);

  return newTimestamp;
}
const myPriceFormatter = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'symbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format;
export const customPriceFormatter = (value) => {
  const formattedValue = myPriceFormatter(value);
  return formattedValue.replace(/([^\d.,]+)(\d)/, '$1 $2');
};