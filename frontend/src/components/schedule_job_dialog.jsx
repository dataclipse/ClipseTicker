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
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [job_type, setJobType] = useState('');
    const [service, setService] = useState('');
    const [owner, setOwner] = useState('');
    const [data_fetch_start_date, setDataFetchStartDate] = useState('');
    const [data_fetch_end_date, setDataFetchEndDate] = useState('');
    const [scheduled_start_date, setScheduledStartDate] = useState('');
    const [scheduled_end_date, setScheduledEndDate] = useState('');
    const [scheduled_start_time, setScheduledStartTime] = useState('');
    const [scheduled_end_time, setScheduledEndTime] = useState('');
    const [interval, setInterval] = useState('');
    const [frequency, setFrequency] = useState('');
    const [customInterval, setCustomInterval] = useState('');
    const [dataFetchType, setDataFetchType] = useState('');
    const [selectedDays, setSelectedDays] = useState([]);
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const handleCheckboxChange = (day) => {
        setSelectedDays((prevDays) =>
            prevDays.includes(day)
                ? prevDays.filter((d) => d !== day) 
                : [...prevDays, day]               
        );
    };

    const handleJobTypeChange = (event) => {
        const selected_job_type = event.target.value
        setJobType(event.target.value);

        if (!selected_job_type) {
            setService('');
        }
    };

    const handleServiceChange = (event) => {
        setService(event.target.value)
    };

    const handleFrequencyChange = (event) => {
        setFrequency(event.target.value)
    };

    const handleCustomIntervalChange = (event) => {
    	setCustomInterval(event.target.value)
    };
    
    const handleDataFetchTypeChange = (event) => {
        setDataFetchType(event.target.value)
    };

    const handleFetch = () => {
        onClose();
        const token = localStorage.getItem("auth_token");
        const selectedDaysJSON = JSON.stringify(selectedDays);
        fetch("/api/jobs_schedule", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
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
                selectedDaysJSON
            }),
        })
        .then((response) => {
            if (!response.ok)
                throw new Error("Failed to schedule a job");
            return response.json();
        })
        .then((data) => {
            onSubmit(data);
        })
        .catch((error) => {
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
                {/* Conditionally Render Service Dropdown */}
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
                
                {frequency === "once" && job_type === "api_fetch" &&(
                    <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                        <InputLabel>Data Fetch Type</InputLabel>
                            <Select value={dataFetchType} onChange={handleDataFetchTypeChange} label='Data Fetch Type'>
                                <MenuItem value="date_range">Date Range</MenuItem>
                                <MenuItem value="2yrs_data">Max Data Fetch (2 Years Data, ~3 hour run time)</MenuItem>
                            </Select>
                    </FormControl>
                )}

                {/* Data Fetch Start Date */}
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
                {/* Data Fetch  End Date */}
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
                {/* Start Time */}
                
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
                
                {/* Conditionally Render End Time */}
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
                {/* Custom Interval Dropdown */}
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
            <DialogActions>
                <Button variant="contained" onClick={onClose} sx={{ backgroundColor: colors.grey[500] }}>Cancel</Button>
                <Button onClick={handleFetch} variant="contained" color="primary">Schedule</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ScheduleJobDialog;