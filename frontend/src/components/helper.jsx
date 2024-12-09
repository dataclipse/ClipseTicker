// src/components/helper.jsx
import React from "react";
import { Box } from "@mui/material";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import { z } from "zod";
import moment from 'moment';

//Helper functions for the ClipseTicker application
//Contains utilities for date formatting, data validation, and UI components

// Simple Zod schema to validate that dates are strings
const dateSchema = z.object({
  start_date: z.string(),
  end_date: z.string()
});

//  Checks if a given date is before today
const isBeforeToday = (date) => {
  const today = new Date();
  return date >= today;
};

// Validates a date range and sets error messages
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

// Updates form state with new field values
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

// Calculates start and end dates based on data fetch type
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

// Formats PE (Price-to-Earnings) ratio
export function formatPE(value) {
  if (value === 0) return undefined;
  return parseFloat(value).toFixed(2);
};

// Converts timestamp to seconds by removing milliseconds
export function convertTimestamp(timestamp){

  // Get the new timestamp without milliseconds
  const newTimestamp = Math.floor(timestamp / 1000);

  return newTimestamp;
}

// Helper function to check if a date is a weekend
const isWeekend = (date) => {
  return moment(date).day() === 0 || moment(date).day() === 6;
};

// Helper function to get date minus N business days
const getDateMinusBusinessDays = (date, businessDays) => {
  // Start from yesterday
  const currentDate = moment(date).subtract(1, 'days');
  let remainingDays = businessDays - 1;
  
  while (remainingDays > 0) {
      currentDate.subtract(1, 'days');
      if (!isWeekend(currentDate)) {
          remainingDays--;
      }
  }
  return currentDate.toDate();
};

// Helper function for time frame filtering
export const getFilteredDateByTimeFrame = (timeFrame, dataDate, now) => {
  const momentDate = moment(dataDate);
  const momentNow = moment(now);

  switch (timeFrame) {  
      case '1w':
          return momentDate.isAfter(getDateMinusBusinessDays(now, 5));
      case '1m':
          return momentDate.isAfter(momentNow.clone().subtract(1, 'month'));
      case 'YTD':
          return momentDate.isAfter(momentNow.clone().startOf('year'));
      case '1y':
          return momentDate.isAfter(momentNow.clone().subtract(1, 'year'));
      case '2y':
          return momentDate.isAfter(momentNow.clone().subtract(2, 'year'));
      default:
          return true;
  }
};

export const formatNumericMagnitude = (value) => {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  } else {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
};

// Calculate PE Ratio from price and EPS
export const calculatePERatio = (price, eps) => {
  if (!price || !eps || eps === 0) return null;
  return (price / eps).toFixed(2);
};