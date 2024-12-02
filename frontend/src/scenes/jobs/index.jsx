// src/scenes/jobs/index.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Button, Typography, useTheme, Stack } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/header";
import ScheduleJobDialog from "../../components/schedule_job_dialog";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { formatRunTime, convertToLocalTime, formatString, parseWeekdays } from "../../components/helper";
import { useAuth } from "../../context/auth_context";
import { styled } from '@mui/material/styles';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";


// Jobs Component - Displays a list of jobs with actions for managing them.
// Includes options for adding and scheduling jobs, with permissions based on user role.
const Jobs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [Jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openScheduleJobDialog, setOpenScheduleJobDialog] = useState(false)
  const [expandedPanels, setExpandedPanels] = useState({
    Running: false,
    Scheduled: false,
    Complete: false,
  });

  // Opens and closes the modals for adding or scheduling jobs
  const handleOpenScheduleJobDialog = useCallback(() => setOpenScheduleJobDialog(true), []);
  const handleCloseScheduleJobDialog = useCallback(() => setOpenScheduleJobDialog(false), []);
  const { user } = useAuth();

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    data_fetch_start_date: false,
    data_fetch_end_date: false,
    interval_days: false,
    weekdays: false,
  });

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/jobs_schedule", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.status === 401) {
        // Unauthorized, redirect to login page
        navigate("/login");
        return;
      }
      const data = await response.json();
      const formattedData = data.map((jobs, index) => ({
        id: index,
        job_type: formatString(jobs.job_type),
        job_type_original: jobs.job_type,
        service: formatString(jobs.service),
        service_original: jobs.service,
        status: jobs.status,
        owner: jobs.owner,
        frequency: formatString(jobs.frequency),
        frequency_original: jobs.frequency,
        scheduled_start_date: convertToLocalTime(jobs.scheduled_start_date),
        scheduled_start_date_original: jobs.scheduled_start_date,
        scheduled_end_date: convertToLocalTime(jobs.scheduled_end_date),
        data_fetch_start_date: jobs.data_fetch_start_date,
        data_fetch_end_date: jobs.data_fetch_end_date,
        interval_days: jobs.interval_days,
        weekdays: parseWeekdays(jobs.weekdays), 
        run_time: formatRunTime(jobs.run_time),
        created_at: jobs.created_at,
        updated_at: jobs.updated_at,
      }));
      setJobs(formattedData);
    } catch (error) {
      console.error("Error fetching Jobs data:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleDeleteJobSchedule = useCallback(async (jobSchedule) => {
    try {
      const token = localStorage.getItem('auth_token');

      // Parse the original date string to match SQLite format
      const date = new Date(jobSchedule.scheduled_start_date_original);
      const formattedDate = date.toISOString().replace('T', ' ').split('.')[0] + '.000000';

      const requestData = {
        job_type: jobSchedule.job_type_original,
        service: jobSchedule.service_original,
        frequency: jobSchedule.frequency_original,
        scheduled_start_date: formattedDate,
      };

      const response = await fetch('/api/jobs_schedule', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
    });
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to delete job schedule');
    }
    fetchData();
    } catch (error) {
      console.error('Error deleting job schedule:', error);
    }
  }, [fetchData]);

  const columns = useMemo(() => { 
    const baseColumns = [
      {
        field: "job_type",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Job Type"}</Typography>
        ),
        flex: 0.4,
      },
      {
        field: "service",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Service"}</Typography>
        ),
        flex: 0.5,
      },
      {
        field: "status",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Status"}</Typography>
        ),
        renderCell: (params) => (
          <Typography
            sx={{
              fontWeight: "medium",
              color: params.row.status === "Failed" ? colors.redAccent[500] : "inherit",
              display: 'flex',
              justifyContent: 'left',
              alignItems: 'center',
              width: '100%', 
              height: '100%',
              textAlign: 'left'
            }}
        >
          {params.row.status}
        </Typography>
        ),
        flex: 0.4,
        align: 'center', 
      },
      {
        field: "owner",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Owner"}</Typography>
        ),
        flex: 0.5,
      },
      {
        field: "frequency",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Frequency"}</Typography>
        ),
        flex: 0.4,
      },
      {
        field: "scheduled_start_date",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Scheduled Start Date"}</Typography>
        ),
        flex: 0.5,
      },
      {
        field: "scheduled_end_date",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Scheduled End Date"}</Typography>
        ),
        flex: 0.5,
      },
      {
        field: "data_fetch_start_date",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Data Fetch Start Date"}</Typography>
        ),
        flex: 0.5,
      },
      {
        field: "data_fetch_end_date",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Data Fetch End Date"}</Typography>
        ),
        flex: 0.5,
      },
      {
        field: "interval_days",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Interval Days"}</Typography>
        ),
        flex: 0.5,
      },
      {
        field: "weekdays",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Days of the Week"}</Typography>
        ),
        flex: 0.5,
      },
      {
        field: "run_time",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Run Time"}</Typography>
        ),
        flex: 0.4,
      },
      {
        field: "created_at",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Created At"}</Typography>
        ),
        flex: 0.5,
      },
      {
        field: "updated_at",
        renderHeader: () => (
          <Typography sx={{ fontWeight: "bold" }}>{"Updated At"}</Typography>
        ),
        flex: 0.5,
      },
      {
        field: "actions",
        headerName: "Actions",
        renderCell: (params) => (
          <Stack direction="row" alignItems={"center"} height={"100%"} spacing={0} sx={{width:'100%', justifyContent: 'flex-start', pl: 1}}>
            {/* Delete button for deleting API key */}
            <Button
              onClick={() => user?.role === 'Admin' && handleDeleteJobSchedule(params.row)}
              sx={{
                cursor: "pointer",
                color: colors.redAccent[500],
                minWidth: 'auto',
                padding: 0
              }}
            >
              <DeleteIcon 
                sx={{
                  color: user?.role === 'Admin' ? 'inherit' : '#808080',
                  cursor: user?.role === 'Admin' ? 'pointer' : 'not-allowed',
                  pointerEvents: user?.role === 'Admin' ? 'auto' : 'none'
                }}
              />
            </Button>
          </Stack>
        ),
        flex: 0.2,
      },
    ];
    return baseColumns;
  }, [colors.redAccent, handleDeleteJobSchedule, user?.role]);

  const AccordionComponent = ({ title, filterCondition }) => (
    <Accordion 
      expanded={expandedPanels[filterCondition]}
      onChange={() => setExpandedPanels(prev => ({ ...prev, [filterCondition]: !prev[filterCondition] }))}
      m="40px 0 0 0"
      display="flex"
      sx={{
        "& .MuiDataGrid-root": {
              border: "none",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "none",
              backgroundColor: colors.primary[500]
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: colors.blueAccent[700],
              borderBottom: "none",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-virtualScroller": {
              backgroundColor: colors.primary[400],
            },
            "& .MuiPaginationItem-root": {
              borderTop: "none",
              backgroundColor: `${colors.blueAccent[700]} !important`,
            },
            backgroundColor: colors.primary[500]
      }}
    >
      <AccordionSummary aria-controls={`${filterCondition}-content`} id={`${filterCondition}-header`}>
        <Typography sx={{ fontWeight: "bold" }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <DataGrid
          rows={Jobs.filter((job) => job.status === filterCondition)}
          columns={columns}
          loading={loading}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) =>
            setColumnVisibilityModel(newModel)
          }
        />
      </AccordionDetails>
    </Accordion>
  );

  // Memoize AccordionComponent to prevent unnecessary re-renders
  const MemoizedAccordionComponent = useCallback(AccordionComponent, [Jobs, loading, colors.blueAccent, colors.primary, columns, expandedPanels, columnVisibilityModel]);

  const Accordion = styled((props) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
  ))(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&::before': {
      display: 'none',
    },
  }));

  const AccordionSummary = styled((props) => (
    <MuiAccordionSummary
      expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
      {...props}
    />
  ))(({ theme }) => ({

    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
      marginLeft: theme.spacing(1),
    },
  }));

  const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: '1px solid rgba(0, 0, 0, .125)',
  }));

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const runningJobs = Jobs.filter(job => job.status === "Running").length > 0;
    const scheduledJobs = Jobs.filter(job => job.status === "Scheduled").length > 0;
    const completeJobs = Jobs.filter(job => job.status === "Complete").length > 0;

    setExpandedPanels({ Running: runningJobs, Scheduled: scheduledJobs, Complete: completeJobs });
  }, [Jobs]);

  return (
    <Box m="20px">
      <Header
        title="Data Fetch"
        subtitle="Status of Jobs to Fetch Stock Data"
      />
      {/* Button to open the modal */}
      <Box display="flex" justifyContent="left" alignItems="left" mb={2} >
        <Button
          variant="outlined" 
          sx={{ 
            borderColor: colors.greenAccent[500], 
            color: colors.greenAccent[500] 
          }}
          onClick={handleOpenScheduleJobDialog}
          startIcon={<AddCircleOutlineIcon />}
          disabled={user.role !== "Admin"}

        >
          Schedule a New Job
        </Button>
        <Button
          variant="outlined"
          sx={{ 
            borderColor: colors.greenAccent[500], 
            color: colors.greenAccent[500], 
            ml: 2
          }}
          onClick={fetchData}
          startIcon={<RefreshIcon  />}
        >
          Refresh Job Schedule
        </Button>
      </Box>

      {/* Modal Components */}
      <ScheduleJobDialog open={openScheduleJobDialog} onClose={handleCloseScheduleJobDialog} />

      <MemoizedAccordionComponent title="Running Jobs" filterCondition="Running" />
      <MemoizedAccordionComponent title="Scheduled Jobs" filterCondition="Scheduled" />
      <MemoizedAccordionComponent title="Completed Jobs" filterCondition="Complete" />
    </Box>
  );
};

export default Jobs;
