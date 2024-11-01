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
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fetchOption, setFetchOption] = useState("date_range");

  const handleFetch = () => {
    onClose();
    if (fetchOption === "two_years") {
      fetch("/api/jobs/2yr")
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch two years data");
          return response.json();
        })
        .then((data) => {
          onSubmit(data);
        })
        .catch((error) => {
          console.error("Error fetching two years data:", error);
        });
    } else {
      fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      })
        .then((response) => {
          if (!response.ok)
            throw new Error("Failed to fetch data for date range");
          return response.json();
        })
        .then((data) => {
          onSubmit(data);
        })
        .catch((error) => {
          console.error("Error fetching data from date range:", error);
        });
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Job</DialogTitle>
      <DialogContent>
        <FormControl component="fieldset">
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

        {fetchOption === "date_range" && (
          <Box display="flex" flexDirection="column" mt={2}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ backgroundColor: colors.grey[500] }}
        >
          Cancel
        </Button>
        <Button onClick={handleFetch} variant="contained" color="primary">
          Fetch Data
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddJobModal;
