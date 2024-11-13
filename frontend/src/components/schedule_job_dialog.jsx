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
import { useAuth } from "../context/auth_context";
import { validateDateRange, updateFormState, calculateDataFetchDates } from '../components/helper';


const ScheduleJobDialog = ({ open, onClose, onSubmit = () => {} }) => {
    // Access the current theme for styling
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { user } = useAuth();

    // State variables for managing form inputs
    const [formState, setFormState] = useState({
        jobType: '', // Job type
        service: '', // Service used for the job
        owner: user?.username, // Job owner
        dataFetchStartDate: '', // Start date for data fetching
        dataFetchEndDate: '', // End date for data fetching
        scheduledStartDate: '', // Job scheduled start date
        scheduledEndDate: '', // Job scheduled end date
        scheduledStartTime: '', // Job start time
        scheduledEndTime: '', // Job end time
        interval: '', // Interval between job runs
        frequency: '', // Job frequency
        customInterval: '', // Custom interval for scheduling
        dataFetchType: '', // Type of data fetch
        selectedDays: [], // Selected days for job scheduling
        dateError: "", // Error message for date validation
        dataFetchDateError: "", // Error message for date validation
        primaryKeyFail: "", // Error message for date validation
    });

    // Define days of the week for selection
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const checkJobScheduleExists = async () => {
        // Retrieve authentication token from local storage
        const token = localStorage.getItem("auth_token");
        // Combine scheduledStartDate and scheduledStartTime
        const combinedStartDateTime = `${formState.scheduledStartDate} ${formState.scheduledStartTime}:00.000000`;

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        };

        const body = JSON.stringify({
            jobType: formState.jobType,
            service: formState.service,
            frequency: formState.frequency,
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

    const canSchedule = () => {
        // Array of all conditions that need to be true
        const conditions = [
            formState.dateError === "", // No date error
            formState.jobType !== "", // Job type is selected
            formState.service !== "", // Service is selected
            formState.owner !== "", // Owner is provided
            formState.scheduledStartDate !== "", // Start date is provided
            formState.scheduledStartTime !== "", // Start time is provided
        ];

        // Use every() to return true only if all conditions are true
        return conditions.every(condition => condition);
    };

    const clearFields = (excludedFields = []) => {
        // Create a new state object based on the current formState
        setFormState(prevState => {
            const newState = { ...prevState };

            // Reset each field only if it is not included in excludedFields
            Object.keys(newState).forEach(field => {
                if (!excludedFields.includes(field)) {
                    // Set default values based on the field
                    newState[field] = field === 'owner' ? user?.username : '';
                }
            });

            return newState; // Return the updated state
        });
    };

    // Handlers for date changes
    const handleDateChange = useCallback((field, value, validateFunc) => {
        updateFormState(field, value);
        validateFunc(value, formState[field === 'scheduledStartDate' ? 'scheduledEndDate' : 'scheduledStartDate'], (error) => {
            updateFormState(field === 'scheduledStartDate' ? 'dateError' : 'dataFetchDateError', error);
        }, true);
    }, [formState]);

    const handleStartDateChange = (e) => handleDateChange('scheduledStartDate', e.target.value, validateDateRange);
    const handleEndDateChange = (e) => handleDateChange('scheduledEndDate', e.target.value, validateDateRange);
    const handleDataFetchStartDateChange = (e) => handleDateChange('dataFetchStartDate', e.target.value, validateDateRange);
    const handleDataFetchEndDateChange = (e) => handleDateChange('dataFetchEndDate', e.target.value, validateDateRange);

    // Handle checkbox changes for day selection
    const handleCheckboxChange = useCallback((day) => {
        setFormState(prevState => {
            const newSelectedDays = prevState.selectedDays.includes(day)
                ? prevState.selectedDays.filter((d) => d !== day) // Remove day if already selected
                : [...prevState.selectedDays, day]; // Add day if not selected

            return {
                ...prevState,
                selectedDays: newSelectedDays, // Update selectedDays in formState
            };
        });
    }, []);

    // Handle submission of the form data to the backend API
    const handleFetch = () => {
        // Close the dialog
        onClose();

        // Get the current timezone
        const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Retrieve authentication token from local storage
        const token = localStorage.getItem("auth_token");

        // Convert selected days to JSON for transmission
        const selectedDaysJSON = JSON.stringify(formState.selectedDays);

        // Send a POST request to the API endpoint with job scheduling data
        fetch("/api/jobs_schedule", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`, // Add auth token to headers
                "Content-Type": "application/json", // Specify JSON content type
            },
            body: JSON.stringify({ 
                jobType: formState.jobType, 
                service: formState.service, 
                owner: formState.owner, 
                frequency: formState.frequency,
                dataFetchStartDate: formState.dataFetchStartDate, 
                dataFetchEndDate: formState.dataFetchEndDate, 
                scheduledStartDate: formState.scheduledStartDate, 
                scheduledEndDate: formState.scheduledEndDate, 
                scheduledStartTime: formState.scheduledStartTime,
                scheduledEndTime: formState.scheduledEndTime,
                interval: formState.interval,
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
        const exists = await checkJobScheduleExists(); // Check if the job schedule already exists
        if (exists) {
            updateFormState('primaryKeyFail', "A schedule with this configuration already exists at this start date. Unable to schedule."); 
            return;
        }
        // Proceed to schedule the job and close the dialog
        handleFetch(); // Call the function to handle the fetch
        clearFields(); // Clear fields after scheduling
    };

    // Ensure the dates are calculated correctly if the datatype changes
    useEffect(() => {
        if (formState.dataFetchType) {
            calculateDataFetchDates(formState.dataFetchType, updateFormState); // Calculate data fetch dates when dataFetchType changes
        }
    }, [formState.dataFetchType]); 

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule a Job</DialogTitle>
            <DialogContent>
                {/* Job Type Dropdown */}
                <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                    <InputLabel>Job Type</InputLabel>
                    <Select label="Job Type" value={formState.jobType} onChange={({ target: { value } }) => updateFormState('jobType', value)}>
                        <MenuItem value="api_fetch">API Fetch</MenuItem>
                        <MenuItem value="data_scrape">Data Scrape</MenuItem>
                    </Select>
                </FormControl>

                {/* Conditionally Render Service Dropdown based on jobType */}
                {formState.jobType && (
                    <FormControl fullWidth margin="normal" color={colors.redAccent[500]} disabled={!formState.jobType}>
                        <InputLabel>Service</InputLabel>
                        <Select label="Service" value={formState.service} onChange={({ target: { value } }) => updateFormState('service', value)}>
                            {formState.jobType === "api_fetch" && (
                                <MenuItem value="polygon_io">Polygon.io</MenuItem>
                            )}
                            {formState.jobType === "data_scrape" && (
                                <MenuItem value="stock_analysis">StockAnalysis</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                )}
                
                {/* Owner Text Field */}
                <TextField 
                    label="Owner" 
                    fullWidth
                    value={formState.owner}
                    onChange={({ target: { value } }) => updateFormState('owner', value)}
                    margin="normal" 
                    color={colors.redAccent[500]}
                />

                {/* Frequency Dropdown */}
                <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                    <InputLabel>Frequency</InputLabel>
                    <Select value={formState.frequency} onChange={({ target: { value } }) => updateFormState('frequency', value)} label='Frequency'>
                        <MenuItem value="once">Once</MenuItem>
                        <MenuItem value="recurring_daily">Recurring Daily</MenuItem>
                        {formState.jobType !== "api_fetch" && (
                            <MenuItem value="custom_schedule">Custom Schedule</MenuItem>
                        )}
                    </Select>
                </FormControl>
                
                {/* Data Fetch Type for one-time API fetch jobs */}
                {formState.jobType === "api_fetch" && (
                    <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                        <InputLabel>Data Fetch Type</InputLabel>
                        <Select value={formState.dataFetchType} onChange={({ target: { value } }) => updateFormState('dataFetchType', value)} label='Data Fetch Type'>
                            <MenuItem value="date_range">Custom Date Range</MenuItem>
                            <MenuItem value="2wk_data">Relative 2 Week Data Fetch</MenuItem>
                            <MenuItem value="2yrs_data">Max Data Fetch (2 Years Data, ~3 hour run time)</MenuItem>
                        </Select>
                    </FormControl>
                )}

                {/* Data Fetch Start and End Dates for API fetch jobs with date range */}
                {formState.jobType === "api_fetch" && formState.frequency !== "recurring_daily" && formState.dataFetchType === 'date_range' && (
                    <>
                        <TextField 
                            label="Data Fetch Start Date" 
                            type="date" 
                            fullWidth
                            value={formState.dataFetchStartDate}
                            onChange={handleDataFetchStartDateChange} 
                            margin="normal" 
                            slotProps={{ 
                                inputLabel: { shrink: true }, 
                            }}
                            color={colors.redAccent[500]}
                        />
                        <TextField 
                            label="Data Fetch End Date" 
                            type="date" 
                            fullWidth
                            value={formState.dataFetchEndDate}
                            onChange={handleDataFetchEndDateChange} 
                            margin="normal" 
                            slotProps={{ 
                                inputLabel: { shrink: true }, 
                            }}
                            color={colors.redAccent[500]}
                        />
                    </>
                )}
                
                {formState.dataFetchDateError && (
                    <Box color="error.main">
                        {formState.dataFetchDateError}
                    </Box>
                )}

                {/* Schedule Start and End Dates */}
                <TextField 
                    label="First Job Schedule Start Date" 
                    type="date" 
                    fullWidth
                    value={formState.scheduledStartDate}
                    onChange={handleStartDateChange} 
                    margin="normal" 
                    slotProps={{ 
                        inputLabel: { shrink: true }, 
                    }}
                    color={colors.redAccent[500]}
                />
                {formState.jobType === 'data_scrape' && formState.frequency === 'custom_schedule' && (
                    <TextField 
                        label="First Job Schedule End Date" 
                        type="date" 
                        fullWidth
                        value={formState.scheduledEndDate} 
                        onChange={handleEndDateChange} 
                        margin="normal" 
                        slotProps={{ 
                            inputLabel: { shrink: true }, 
                        }}
                        color={colors.redAccent[500]}
                    />
                )}
                {formState.dateError && (
                    <Box color="error.main">
                        {formState.dateError}
                    </Box>
                )}

                {/* Schedule Start and End Times */}
                <TextField 
                    label="First Job Schedule Start Time" 
                    type="time" 
                    fullWidth
                    value={formState.scheduledStartTime} 
                    onChange={({ target: { value } }) => updateFormState('scheduledStartTime', value)} 
                    margin="normal" 
                    slotProps={{ inputLabel: { shrink: true } }} 
                    color={colors.redAccent[500]}
                />
                {formState.jobType === "data_scrape" && formState.frequency === 'custom_schedule' && (
                    <TextField 
                        label="First Job Schedule End Time" 
                        type="time" 
                        fullWidth
                        value={formState.scheduledEndTime}  
                        onChange={({ target: { value } }) => updateFormState('scheduledEndTime', value)} 
                        margin="normal" 
                        slotProps={{ inputLabel: { shrink: true } }}  
                        color={colors.redAccent[500]}  
                    />
                )}

                {/* Custom Interval Options */}
                {formState.frequency === "custom_schedule" && (
                    <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                        <InputLabel>Custom Interval</InputLabel>
                        <Select value={formState.customInterval} onChange={({ target: { value } }) => updateFormState('customInterval', value)} label='Custom Interval'>
                            <MenuItem value="interval_days">Interval in Days</MenuItem>
                            <MenuItem value="weekdays">Specific Days of the Week</MenuItem>
                        </Select>
                    </FormControl>
                )}
                {formState.frequency === "custom_schedule" && formState.customInterval === "interval_days" && (
                    <TextField 
                        label="Interval" 
                        type="number" 
                        fullWidth
                        value={formState.interval} 
                        onChange={({ target: { value } }) => updateFormState('interval', value)} 
                        margin="normal" 
                        color={colors.redAccent[500]}
                    />
                )}
                {formState.frequency === "custom_schedule" && formState.customInterval === "weekdays" && (
                    <Box display='flex' justifyContent='center' sx={{ mt: 2 }}>
                        <FormGroup row>
                            {daysOfWeek.map(day => (
                                <FormControlLabel
                                    key={day}
                                    control={
                                        <Checkbox
                                            checked={formState.selectedDays.includes(day)} // Reflect current state
                                            onChange={() => handleCheckboxChange(day)} // Update state on change
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
                {formState.primaryKeyFail && (
                    <Box color="error.main">
                        {formState.primaryKeyFail}
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

