// src/scenes/jobs/index.jsx
import { Box, Button, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import React, { useState, useEffect, useCallback } from "react";
import Header from "../../components/header";
import AddJobModal from "../../components/add_job_modal";
import ScheduleJobDialog from "../../components/schedule_job_dialog";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { QuickSearchToolbar, formatRunTime } from "../../components/helper";
import { useAuth } from "../../context/auth_context";

// Jobs Component - Displays a list of jobs with actions for managing them.
// Includes options for adding and scheduling jobs, with permissions based on user role.
const Jobs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [Jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openJobModal, setOpenJobModal] = useState(false);
  const [openScheduleJobDialog, setOpenScheduleJobDialog] = useState(false)

  // Opens and closes the modals for adding or scheduling jobs
  const handleOpenJobModal = () => setOpenJobModal(true);
  const handleCloseJobModal = () => setOpenJobModal(false);
  const handleOpenScheduleJobDialog = () => setOpenScheduleJobDialog(true)
  const handleCloseScheduleJobDialog = () => setOpenScheduleJobDialog(false)
  const { user } = useAuth();

  const columns = [
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
      flex: 0.6,
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
  ];

  function formatString(inputString) {
    return inputString.replace(/_/g, ' ').toLowerCase().replace(/\b\w+\b/g, word => word === 'api' ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)); 
  };

  function parseWeekdays(weekdaysStr) {
    try {
        const weekdaysArray = JSON.parse(weekdaysStr); // Parse JSON string into an array
        return weekdaysArray.join(", "); // Convert array to CSV format
    } catch (error) {
        console.error("Error parsing weekdays JSON:", error);
        return weekdaysStr; // Return the original string if parsing fails
    }
  };
  
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
      const data = await response.json();
      const formattedData = data.map((jobs, index) => ({
        id: index,
        job_type: formatString(jobs.job_type),
        service: formatString(jobs.service),
        status: jobs.status,
        owner: jobs.owner,
        frequency: formatString(jobs.frequency),
        scheduled_start_date: jobs.scheduled_start_date,
        scheduled_end_date: jobs.scheduled_end_date,
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
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return (
    <Box m="20px">
      <Header
        title="Data Fetch"
        subtitle="Status of Jobs to Fetch Stock Data"
      />
      {/* Button to open the modal */}
      <Box mb={2}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleOpenScheduleJobDialog}
          startIcon={<AddCircleOutlineIcon />}
          disabled={user.role !== "Admin"}

        >
          Schedule a New Job
        </Button>
      </Box>

      {/* Modal Components */}
      <AddJobModal
        open={openJobModal}
        onClose={handleCloseJobModal}
        onSubmit={handleCloseJobModal}
      />
      <ScheduleJobDialog
        open={openScheduleJobDialog}
        onClose={handleCloseScheduleJobDialog}
      />
      <Box
        m="40px 0 0 0"
        display="flex"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
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
        }}
      >
        <DataGrid
          slots={{ toolbar: QuickSearchToolbar }}
          rows={Jobs}
          columns={columns}
          loading={loading}
        />
      </Box>
    </Box>
  );
};

export default Jobs;
