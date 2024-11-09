// src/components/schedule_job_dialog.jsx

import React, { useState } from "react";
import {
    Box,
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    Checkbox, 
    FormGroup, 
    FormControlLabel
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";

const ScheduleJobDialog = ({ open, onClose, onSubmit }) => {
    // Access the current theme for styling
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    // State variables for managing form inputs
    const [job_type, setJobType] = useState(''); // Job type
    const [service, setService] = useState(''); // Service used for the job
    const [owner, setOwner] = useState(''); // Job owner
    const [data_fetch_start_date, setDataFetchStartDate] = useState(''); // Start date for data fetching
    const [data_fetch_end_date, setDataFetchEndDate] = useState(''); // End date for data fetching
    const [scheduled_start_date, setScheduledStartDate] = useState(''); // Job scheduled start date
    const [scheduled_end_date, setScheduledEndDate] = useState(''); // Job scheduled end date
    const [scheduled_start_time, setScheduledStartTime] = useState(''); // Job start time
    const [scheduled_end_time, setScheduledEndTime] = useState(''); // Job end time
    const [interval, setInterval] = useState(''); // Interval between job runs
    const [frequency, setFrequency] = useState(''); // Job frequency
    const [customInterval, setCustomInterval] = useState(''); // Custom interval for scheduling
    const [dataFetchType, setDataFetchType] = useState(''); // Type of data fetch
    const [selectedDays, setSelectedDays] = useState([]); // Selected days for job scheduling
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // Days of the week for selection

    // Handle checkbox changes for day selection
    const handleCheckboxChange = (day) => {
        setSelectedDays((prevDays) =>
            prevDays.includes(day)
                ? prevDays.filter((d) => d !== day) // Remove day if already selected
                : [...prevDays, day] // Add day if not selected              
        );
    };

    // Handle changes to job type and reset service if no job type is selected
    const handleJobTypeChange = (event) => {
        const selected_job_type = event.target.value
        setJobType(event.target.value);

        if (!selected_job_type) {
            setService('');
        }
    };

    // Handle changes to the service
    const handleServiceChange = (event) => {
        setService(event.target.value)
    };

    // Handle changes to job frequency
    const handleFrequencyChange = (event) => {
        setFrequency(event.target.value)
    };

    // Handle changes to custom interval
    const handleCustomIntervalChange = (event) => {
    	setCustomInterval(event.target.value)
    };
    
    // Handle changes to data fetch type
    const handleDataFetchTypeChange = (event) => {
        setDataFetchType(event.target.value)
    };

    // Handle submission of the form data to the backend API
    const handleFetch = () => {
        // Close the dialog
        onClose();

        // Retrieve authentication token from local storage
        const token = localStorage.getItem("auth_token");

        // Convert selected days to JSON for transmission
        const selectedDaysJSON = JSON.stringify(selectedDays);

        // Send a POST request to the API endpoint with job scheduling data
        fetch("/api/jobs_schedule", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`, // Add auth token to headers
                "Content-Type": "application/json", // Specify JSON content type
            },
            body: JSON.stringify({ 
                job_type, 
                service, 
                owner, 
                frequency,
                data_fetch_start_date, 
                data_fetch_end_date, 
                scheduled_start_date, 
                scheduled_end_date, 
                scheduled_start_time,
                scheduled_end_time,
                interval,
                selectedDaysJSON // Include selected days as JSON
            }),
        })
        .then((response) => {
            // Throw an error if the request was unsuccessful
            if (!response.ok)
                throw new Error("Failed to schedule a job");
            return response.json();
        })
        .then((data) => {
            // Pass the response data to the onSubmit handler
            onSubmit(data);
        })
        .catch((error) => {
            // Log any errors encountered during the request
            console.error("Error scheduling a job:", error);
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule a Job</DialogTitle>
            <DialogContent>
                {/* Job Type Dropdown */}
                <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                        <InputLabel>Job Type</InputLabel>
                        <Select label="Job Type" value={job_type} onChange={handleJobTypeChange}>
                            <MenuItem value="api_fetch">API Fetch</MenuItem>
                            <MenuItem value="data_scrape">Data Scrape</MenuItem>
                        </Select>
                </FormControl>

                {/* Conditionally Render Service Dropdown based on job_type */}
                {job_type && (
                    <FormControl fullWidth margin="normal" color={colors.redAccent[500]} disabled={!job_type}>
                            <InputLabel>Service</InputLabel>
                            <Select label="Service" value={service} onChange={handleServiceChange}>
                                {job_type === "api_fetch" && (
                                    <MenuItem value="polygon_io">Polygon.io</MenuItem>
                                )}
                                {job_type === "data_scrape" && (
                                    <MenuItem value="stock_analysis">StockAnalysis</MenuItem>
                                )}
                            </Select>
                    </FormControl>
                )}
                
                {/* Owner Text Field */}
                <TextField 
                    label="Owner" 
                    fullWidth
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    margin="normal" 
                    color={colors.redAccent[500]}
                />

                {/* Frequency Dropdown */}
                <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                    <InputLabel>Frequency</InputLabel>
                        <Select value={frequency} onChange={handleFrequencyChange} label='Frequency'>
                            <MenuItem value="once">Once</MenuItem>
                            <MenuItem value="recurring_daily">Recurring Daily</MenuItem>
                            {job_type !== "api_fetch" && (
                                <MenuItem value="custom_schedule">Custom Schedule</MenuItem>
                            )}
                        </Select>
                </FormControl>
                
                {/* Data Fetch Type for one-time API fetch jobs */}
                {frequency === "once" && job_type === "api_fetch" &&(
                    <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                        <InputLabel>Data Fetch Type</InputLabel>
                            <Select value={dataFetchType} onChange={handleDataFetchTypeChange} label='Data Fetch Type'>
                                <MenuItem value="date_range">Date Range</MenuItem>
                                <MenuItem value="2yrs_data">Max Data Fetch (2 Years Data, ~3 hour run time)</MenuItem>
                            </Select>
                    </FormControl>
                )}

                {/* Data Fetch Start and End Dates for API fetch jobs with date range */}
                {job_type === "api_fetch" &&  frequency !== "recurring_daily" && dataFetchType === 'date_range' && (
                    <TextField 
                        label="Data Fetch Start Date" 
                        type="date" 
                        fullWidth
                        value={data_fetch_start_date}
                        onChange={(e) => setDataFetchStartDate(e.target.value)} 
                        margin="normal" 
                        slotProps={{ 
                            inputLabel: { shrink: true }, 
                        }}
                        color={colors.redAccent[500]}
                    />
                )}

                {/* Schedule Start and End Dates */}
                {job_type === "api_fetch" &&  frequency !== "recurring_daily" && dataFetchType === 'date_range' && (
                <TextField 
                    label="Data Fetch End Date" 
                    type="date" 
                    fullWidth
                    value={data_fetch_end_date}
                    onChange={(e) => setDataFetchEndDate(e.target.value)} 
                    margin="normal" 
                    slotProps={{ 
                        inputLabel: { shrink: true }, 
                    }}
                    color={colors.redAccent[500]}
                />
                )}
                <TextField 
                    label="First Job Schedule Start Date" 
                    type="date" 
                    fullWidth
                    value={scheduled_start_date}
                    onChange={(e) => setScheduledStartDate(e.target.value)} 
                    margin="normal" 
                    slotProps={{ 
                        inputLabel: { shrink: true }, 
                    }}
                    color={colors.redAccent[500]}
                />
                {job_type === 'data_scrape' && (
                    <TextField 
                        label="First Job Schedule End Date" 
                        type="date" 
                        fullWidth
                        value={scheduled_end_date} 
                        onChange={(e) => setScheduledEndDate(e.target.value)} 
                        margin="normal" 
                        slotProps={{ 
                            inputLabel: { shrink: true }, 
                        }}
                        color={colors.redAccent[500]}
                    />
                )}

                {/* Schedule Start and End Times */}
                <TextField 
                    label="First Job Schedule Start Time" 
                    type="time" 
                    fullWidth
                    value={scheduled_start_time} 
                    onChange={(e) => setScheduledStartTime(e.target.value)} 
                    margin="normal" 
                    slotProps={{ inputLabel: { shrink: true } }} 
                    color={colors.redAccent[500]}
                />
                {job_type !== "api_fetch" && (
                    <TextField 
                        label="First Job Schedule End Time" 
                        type="time" 
                        fullWidth
                        value={scheduled_end_time}  
                        onChange={(e) => setScheduledEndTime(e.target.value)} 
                        margin="normal" 
                        slotProps={{ inputLabel: { shrink: true } }}  
                        color={colors.redAccent[500]}  
                    />
                )}

                {/* Custom Interval Options */}
                {frequency === "custom_schedule" && (
                    <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                        <InputLabel>Custom Interval</InputLabel>
                            <Select value={customInterval} onChange={handleCustomIntervalChange} label='Custom Interval'>
                                <MenuItem value="interval_days">Interval in Days</MenuItem>
                                <MenuItem value="weekdays">Specific Days of the Week</MenuItem>
                            </Select>
                    </FormControl>
                )}
                {frequency === "custom_schedule" && customInterval === "interval_days" && (
                    <TextField 
                        label="Interval" 
                        type="number" 
                        fullWidth
                        value={interval} 
                        onChange={(e) => setInterval(e.target.value)} 
                        margin="normal" 
                        color={colors.redAccent[500]}
                    />
                )}
                {frequency === "custom_schedule" && customInterval === "weekdays" && (
                    <Box display='flex' justifyContent='center' sx={{ mt: 2 }}>
                        <FormGroup row>
                            {daysOfWeek.map(day => (
                                <FormControlLabel
                                    key={day}
                                    control={
                                        <Checkbox
                                            checked={selectedDays.includes(day)}
                                            onChange={() => handleCheckboxChange(day)}
                                            sx={{
                                                color: colors.primary[100], // Unselected color
                                                '&.Mui-checked': {
                                                    color: colors.grey[400], // Selected color
                                                }
                                            }}
                                        />
                                    }
                                    label={day}
                                />
                            ))}
                        </FormGroup>
                    </Box>
                )}
            </DialogContent>

            {/* Dialog Action Buttons */}
            <DialogActions>
                <Button variant="contained" onClick={onClose} sx={{ backgroundColor: colors.grey[500] }}>Cancel</Button>
                <Button onClick={handleFetch} variant="contained" color="primary">Schedule</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ScheduleJobDialog;