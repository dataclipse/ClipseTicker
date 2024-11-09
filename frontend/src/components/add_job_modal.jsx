// src/components/add_job_modal.jsx
import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";

const AddJobModal = ({ open, onClose, onSubmit }) => {
  // Get the theme and colors
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // State hooks for date inputs and fetch option
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fetchOption, setFetchOption] = useState("date_range"); // Default option is date range

  // Handler for submitting the job request
  const handleFetch = () => {
    onClose(); // Close the modal after submission
    const token = localStorage.getItem("auth_token"); // Retrieve auth token from local storage
    
    // Handle data fetch based on selected option
    if (fetchOption === "two_years") {
      // Fetch data for two years if the 'two_years' option is selected
      fetch("/api/jobs/2yr", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch two years data");
          return response.json();
        })
        .then((data) => {
          onSubmit(data); // Pass fetched data to onSubmit function
        })
        .catch((error) => {
          console.error("Error fetching two years data:", error);
        });
    } else {
      // Fetch data for a specific date range if 'date_range' option is selected
      fetch("/api/jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startDate, endDate }),
      })
      .then((response) => {
        if (!response.ok)
          throw new Error("Failed to fetch data for date range");
        return response.json();
      })
      .then((data) => {
        onSubmit(data); // Pass fetched data to onSubmit function
      })
      .catch((error) => {
        console.error("Error fetching data from date range:", error);
      });
    }
  };

  return (
    // Dialog component for the modal, controlled by the 'open' prop
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Job</DialogTitle>
      <DialogContent>
        <FormControl component="fieldset">
          {/* Radio buttons to choose between data fetch options */}
          <RadioGroup
            value={fetchOption}
            onChange={(e) => setFetchOption(e.target.value)}
          >
            <FormControlLabel
              value="date_range"
              control={<Radio />}
              label="Polygon.io - Data Fetch for Date Range"
            />
            <FormControlLabel
              value="two_years"
              control={<Radio />}
              label="Polygon.io - Data Fetch for Two Years (~3 hour run time)"
            />
          </RadioGroup>
        </FormControl>

        {/* Display date fields only if 'date_range' option is selected */}
        {fetchOption === "date_range" && (
          <Box display="flex" flexDirection="column" mt={2}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ mb: 2 }}
              color={colors.redAccent[500]}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              color={colors.redAccent[500]}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {/* Cancel button to close the modal without action */}
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ backgroundColor: colors.grey[500] }}
        >
          Cancel
        </Button>
        {/* Fetch Data button to trigger data fetching */}
        <Button onClick={handleFetch} variant="contained" color="primary">
          Fetch Data
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddJobModal;
