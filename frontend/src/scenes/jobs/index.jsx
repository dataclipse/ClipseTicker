// src/scenes/jobs/index.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
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

  const columns = useMemo(() =>[
    {
      field: "job_type",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Job Type"}</Typography>
      ),
      flex: 0.5,
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
      flex: 0.6,
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
      flex: 0.6,
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
      flex: 0.5,
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
    }
  ], [colors.redAccent]);

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
        />
      </AccordionDetails>
    </Accordion>
  );

  // Memoize AccordionComponent to prevent unnecessary re-renders
  const MemoizedAccordionComponent = useCallback(AccordionComponent, [Jobs, loading, colors.blueAccent, colors.primary, columns, expandedPanels]);

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
        service: formatString(jobs.service),
        status: jobs.status,
        owner: jobs.owner,
        frequency: formatString(jobs.frequency),
        scheduled_start_date: convertToLocalTime(jobs.scheduled_start_date),
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleOpenScheduleJobDialog}
          startIcon={<AddCircleOutlineIcon />}
          disabled={user.role !== "Admin"}

        >
          Schedule a New Job
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={fetchData}
          startIcon={<RefreshIcon  />}
          disabled={user.role !== "Admin"}
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
