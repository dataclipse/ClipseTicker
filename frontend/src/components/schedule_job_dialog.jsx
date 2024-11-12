// src/components/schedule_job_dialog.jsx

import React, { useState, useEffect, useCallback } from "react";
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
import { z } from "zod";

const ScheduleJobDialog = ({ open, onClose, onSubmit = () => {} }) => {
    // Access the current theme for styling
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    // State variables for managing form inputs
    const [jobType, setJobType] = useState(''); // Job type
    const [service, setService] = useState(''); // Service used for the job
    const [owner, setOwner] = useState(''); // Job owner
    const [dataFetchStartDate, setDataFetchStartDate] = useState(''); // Start date for data fetching
    const [dataFetchEndDate, setDataFetchEndDate] = useState(''); // End date for data fetching
    const [scheduledStartDate, setScheduledStartDate] = useState(''); // Job scheduled start date
    const [scheduledEndDate, setScheduledEndDate] = useState(''); // Job scheduled end date
    const [scheduledStartTime, setScheduledStartTime] = useState(''); // Job start time
    const [scheduledEndTime, setScheduledEndTime] = useState(''); // Job end time
    const [interval, setJobInterval] = useState(''); // Interval between job runs
    const [frequency, setFrequency] = useState(''); // Job frequency
    const [customInterval, setCustomInterval] = useState(''); // Custom interval for scheduling
    const [dataFetchType, setDataFetchType] = useState(''); // Type of data fetch
    const [selectedDays, setSelectedDays] = useState([]); // Selected days for job scheduling
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // Days of the week for selection
    const [dateError, setDateError] = useState(""); // Error message for date validation
    const [dataFetchDateError, setDataFetchDateError] = useState(""); // Error message for date validation
    const [primaryKeyFail, setPrimaryKeyFail] = useState(""); // Error message for date validation
    

    // Simple Zod schema to validate that dates are strings
    const dateSchema = z.object({
        start_date: z.string(),
        end_date: z.string()
    });

    const checkJobScheduleExists = async () => {
        // Retrieve authentication token from local storage
        const token = localStorage.getItem("auth_token");
        // Combine scheduledStartDate and scheduledStartTime
        const combinedStartDateTime = `${scheduledStartDate} ${scheduledStartTime}:00.000000`

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        };

        const body = JSON.stringify({
            jobType,
            service,
            frequency,
            scheduledStartDate: combinedStartDateTime,
        });

        try {
            const response = await fetch("/api/jobs_schedule/check_job", {
                method: "POST",
                headers,
                body,
            });

            // Return early on a non-OK response
            if (!response.ok) return false;

            const data = await response.json();
            return data.exists;
            
        } catch (error) {
            console.error("Error checking job schedule:", error);
            return false;
        }
    };

    // Custom function to check the date order
    const validateDateRange = (start, end, setError, allowFutureDates = false) => {
        try {
            // Basic schema check for valid strings
            dateSchema.parse({ start_date: start, end_date: end });

            const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

            // If future dates are allowed, check that start is today or in the future
            if (allowFutureDates && start < today) {
                setError("Start date must be today or in the future.");
                return false;
            }

            // If future dates are allowed, check that end is today or in the future
            if (allowFutureDates && end < today && end !== '') {
                setError("End date must be today or in the future.");
                return false;
            }
            
            // If future dates are allowed, check that start is before today
            if (!allowFutureDates && start >= today) {
                setError("Start date must be before today.");
                return false;
            }

            // If future dates are allowed, check that end is before today
            if (!allowFutureDates && end >= today) {
                console.log(end) // Debugging line to check the value of end date
                setError("End date must be before today.");
                return false;
            }

            // Ensure start date is before or equal to end date
            if (new Date(start) > new Date(end)) {
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

    const canSchedule = () => {
        // Array of all conditions that need to be true
        const conditions = [
            dateError === "", // No date error
            jobType !== "", // Job type is selected
            service !== "", // Service is selected
            owner !== "", // Owner is provided
            scheduledStartDate !== "", // Start date is provided
            scheduledStartTime !== "", // Start time is provided
        ];

        // Use every() to return true only if all conditions are true
        return conditions.every(condition => condition);
    };

    const clearFields = (excludedFields = []) => {
        // Reset each field only if it is not included in excludedFields
        if (!excludedFields.includes("jobType")) setJobType('');
        if (!excludedFields.includes("service")) setService('');
        if (!excludedFields.includes("owner")) setOwner('');
        if (!excludedFields.includes("dataFetchStartDate")) setDataFetchStartDate('');
        if (!excludedFields.includes("dataFetchEndDate")) setDataFetchEndDate('');
        if (!excludedFields.includes("scheduledStartDate")) setScheduledStartDate('');
        if (!excludedFields.includes("scheduledEndDate")) setScheduledEndDate('');
        if (!excludedFields.includes("scheduledStartTime")) setScheduledStartTime('');
        if (!excludedFields.includes("scheduledEndTime")) setScheduledEndTime('');
        if (!excludedFields.includes("jobInterval")) setJobInterval('');
        if (!excludedFields.includes("frequency")) setFrequency('');
        if (!excludedFields.includes("customInterval")) setCustomInterval('');
        if (!excludedFields.includes("dataFetchType")) setDataFetchType('');
        if (!excludedFields.includes("selectedDays")) setSelectedDays([]);
        if (!excludedFields.includes("dateError")) setDateError('');
        if (!excludedFields.includes("dataFetchDateError")) setDataFetchDateError('');
    };

    const calculateDataFetchDates = useCallback(() => {
        const today = new Date();
        let startDate, endDate;

        // Set endDate to yesterday
        endDate = new Date(today);
        endDate.setDate(today.getDate() - 1); // Subtract 1 day from today's date

        if (dataFetchType === "2yrs_data") {
            startDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
            startDate.setDate(startDate.getDate() + 1);
            // Format dates as needed
            setDataFetchStartDate(startDate.toISOString().split('T')[0]); // Set start date for data fetch
            setDataFetchEndDate(endDate.toISOString().split('T')[0]); // Set end date for data fetch
        } else if (dataFetchType === "2wk_data") {
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 15);
            // Format dates and set
            setDataFetchStartDate(startDate.toISOString().split('T')[0]); // Set start date for data fetch
            setDataFetchEndDate(endDate.toISOString().split('T')[0]); // Set end date for data fetch
        } else {
            return;
        }
    }, [dataFetchType]); // Dependency array includes dataFetchType

    // Handlers for date changes
    const handleStartDateChange = (event) => {
        const newStartDate = event.target.value;
        setScheduledStartDate(newStartDate);
        validateDateRange(newStartDate, scheduledEndDate, setDateError, true);
    };

    const handleEndDateChange = (event) => {
        const newEndDate = event.target.value;
        setScheduledEndDate(newEndDate);
        validateDateRange(scheduledStartDate, newEndDate, setDateError, true);
    };

    // Handlers for date changes
    const handleDataFetchStartDateChange = (event) => {
        const newStartDate = event.target.value;
        setDataFetchStartDate(newStartDate);
        validateDateRange(newStartDate, dataFetchEndDate, setDataFetchDateError, false);
    };

    const handleDataFetchEndDateChange = (event) => {
        const newEndDate = event.target.value;
        setDataFetchEndDate(newEndDate);
        validateDateRange(dataFetchStartDate, newEndDate, setDataFetchDateError, false);
    };

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
        setJobType(event.target.value);
        clearFields(["jobType", "owner"]); // Clear fields except jobType and owner
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
        setDataFetchType(event.target.value);
    };

    // Handle submission of the form data to the backend API
    const handleFetch = () => {
        // Close the dialog
        onClose();

        // Get the current timezone
        const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
                jobType, 
                service, 
                owner, 
                frequency,
                dataFetchStartDate, 
                dataFetchEndDate, 
                scheduledStartDate, 
                scheduledEndDate, 
                scheduledStartTime,
                scheduledEndTime,
                interval,
                selectedDaysJSON,  // Include selected days as JSON
                currentTimezone
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

    const handleScheduleClick = async () => {
        const exists = await checkJobScheduleExists();
        if (exists) {
            setPrimaryKeyFail("A schedule with this configuration already exists at this start date. Unable to schedule.")
            return;
        }
        // Proceed to schedule the job and close the dialog
        handleFetch();
        clearFields();
    };

    // Ensure the dates are calculated correctly if the datatype changes
    useEffect(() => {
        if (dataFetchType) {
            calculateDataFetchDates();
        }
    }, [dataFetchType, calculateDataFetchDates]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule a Job</DialogTitle>
            <DialogContent>
                {/* Job Type Dropdown */}
                <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                        <InputLabel>Job Type</InputLabel>
                        <Select label="Job Type" value={jobType} onChange={handleJobTypeChange}>
                            <MenuItem value="api_fetch">API Fetch</MenuItem>
                            <MenuItem value="data_scrape">Data Scrape</MenuItem>
                        </Select>
                </FormControl>

                {/* Conditionally Render Service Dropdown based on jobType */}
                {jobType && (
                    <FormControl fullWidth margin="normal" color={colors.redAccent[500]} disabled={!jobType}>
                            <InputLabel>Service</InputLabel>
                            <Select label="Service" value={service} onChange={handleServiceChange}>
                                {jobType === "api_fetch" && (
                                    <MenuItem value="polygon_io">Polygon.io</MenuItem>
                                )}
                                {jobType === "data_scrape" && (
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
                            {jobType !== "api_fetch" && (
                                <MenuItem value="custom_schedule">Custom Schedule</MenuItem>
                            )}
                        </Select>
                </FormControl>
                
                {/* Data Fetch Type for one-time API fetch jobs */}
                {frequency === "once" && jobType === "api_fetch" &&(
                    <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                        <InputLabel>Data Fetch Type</InputLabel>
                            <Select value={dataFetchType} onChange={handleDataFetchTypeChange} label='Data Fetch Type'>
                                <MenuItem value="date_range">Custom Date Range</MenuItem>
                                <MenuItem value="2wk_data">Relative 2 Week Data Fetch</MenuItem>
                                <MenuItem value="2yrs_data">Max Data Fetch (2 Years Data, ~3 hour run time)</MenuItem>
                            </Select>
                    </FormControl>
                )}

                {/* Data Fetch Start and End Dates for API fetch jobs with date range */}
                {jobType === "api_fetch" &&  frequency !== "recurring_daily" && dataFetchType === 'date_range' && (
                    <TextField 
                        label="Data Fetch Start Date" 
                        type="date" 
                        fullWidth
                        value={dataFetchStartDate}
                        onChange={handleDataFetchStartDateChange} 
                        margin="normal" 
                        slotProps={{ 
                            inputLabel: { shrink: true }, 
                        }}
                        color={colors.redAccent[500]}
                    />
                )}

                {/* Schedule Start and End Dates */}
                {jobType === "api_fetch" &&  frequency !== "recurring_daily" && dataFetchType === 'date_range' && (
                <TextField 
                    label="Data Fetch End Date" 
                    type="date" 
                    fullWidth
                    value={dataFetchEndDate}
                    onChange={handleDataFetchEndDateChange} 
                    margin="normal" 
                    slotProps={{ 
                        inputLabel: { shrink: true }, 
                    }}
                    color={colors.redAccent[500]}
                />
                )}
                {dataFetchDateError && (
                    <Box color="error.main">
                        {dataFetchDateError}
                    </Box>
                )}
                <TextField 
                    label="First Job Schedule Start Date" 
                    type="date" 
                    fullWidth
                    value={scheduledStartDate}
                    onChange={handleStartDateChange} 
                    margin="normal" 
                    slotProps={{ 
                        inputLabel: { shrink: true }, 
                    }}
                    color={colors.redAccent[500]}
                />
                {jobType === 'data_scrape' && (
                    <TextField 
                        label="First Job Schedule End Date" 
                        type="date" 
                        fullWidth
                        value={scheduledEndDate} 
                        onChange={handleEndDateChange} 
                        margin="normal" 
                        slotProps={{ 
                            inputLabel: { shrink: true }, 
                        }}
                        color={colors.redAccent[500]}
                    />
                )}
                {dateError && (
                    <Box color="error.main">
                        {dateError}
                    </Box>
                )}

                {/* Schedule Start and End Times */}
                <TextField 
                    label="First Job Schedule Start Time" 
                    type="time" 
                    fullWidth
                    value={scheduledStartTime} 
                    onChange={(e) => setScheduledStartTime(e.target.value)} 
                    margin="normal" 
                    slotProps={{ inputLabel: { shrink: true } }} 
                    color={colors.redAccent[500]}
                />
                {jobType === "data_scrape" && (
                    <TextField 
                        label="First Job Schedule End Time" 
                        type="time" 
                        fullWidth
                        value={scheduledEndTime}  
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
                        onChange={(e) => setJobInterval(e.target.value)} 
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
                {primaryKeyFail && (
                    <Box color="error.main">
                        {primaryKeyFail}
                    </Box>
                )}
            </DialogContent>

            {/* Dialog Action Buttons */}
            <DialogActions>
                <Button 
                    variant="contained" 
                    onClick={() => {
                        onClose();
                        clearFields();
                    }} 
                    sx={{ backgroundColor: colors.grey[500] }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleScheduleClick} 
                    variant="contained" 
                    color="primary" 
                    disabled={!canSchedule()} // Disable if any condition in canSchedule fails
                >
                    Schedule
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ScheduleJobDialog;