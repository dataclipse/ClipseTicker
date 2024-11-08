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

const ScheduleJobDialog = ({ open, onClose }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [jobType, setJobType] = useState('');
    const [service, setService] = useState('');
    const [frequency, setFrequency] = useState('');
    const [customInterval, setCustomInterval] = useState('');
    const [dataFetchType, setDataFetchType] = useState('');

    const handleJobTypeChange = (event) => {
        const selectedJobType = event.target.value
        setJobType(event.target.value);

        if (!selectedJobType) {
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
                {/* Conditionally Render Service Dropdown */}
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
                
                <TextField 
                    label="Owner" 
                    fullWidth 
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
                
                {frequency === "once" && jobType === "api_fetch" &&(
                    <FormControl fullWidth margin="normal" color={colors.redAccent[500]}>
                        <InputLabel>Data Fetch Type</InputLabel>
                            <Select value={dataFetchType} onChange={handleDataFetchTypeChange} label='Data Fetch Type'>
                                <MenuItem value="date_range">Date Range</MenuItem>
                                <MenuItem value="2yrs_data">Max Data Fetch (2 Years Data, ~3 hour run time)</MenuItem>
                            </Select>
                    </FormControl>
                )}

                {/* Data Fetch Start Date */}
                {jobType === "api_fetch" &&  frequency !== "recurring_daily" && dataFetchType === 'date_range' && (
                    <TextField 
                        label="Data Fetch Start Date" 
                        type="date" 
                        fullWidth 
                        margin="normal" 
                        slotProps={{ 
                            inputLabel: { shrink: true }, 
                        }}
                        color={colors.redAccent[500]}
                    />
                )}
                {/* Data Fetch  End Date */}
                {jobType === "api_fetch" &&  frequency !== "recurring_daily" && dataFetchType === 'date_range' && (
                <TextField 
                    label="Data Fetch End Date" 
                    type="date" 
                    fullWidth 
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
                    margin="normal" 
                    slotProps={{ inputLabel: { shrink: true } }} 
                    color={colors.redAccent[500]}
                />
                
                {/* Conditionally Render End Time */}
                {jobType !== "api_fetch" && (
                    <TextField 
                        label="First Job Schedule End Time" 
                        type="time" 
                        fullWidth 
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
                        margin="normal" 
                        color={colors.redAccent[500]}
                    />
                )}
                {frequency === "custom_schedule" && customInterval === "weekdays" && (
                    <Box display='flex' justifyContent='center' sx={{ mt: 2 }}>
                        <FormGroup row>
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                <FormControlLabel
                                    key={day}
                                    control={
                                        <Checkbox
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
                <Button onClick={() => { /* Handle submission logic here */ }} variant="contained" color="primary">Schedule</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ScheduleJobDialog;