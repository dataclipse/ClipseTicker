// src/scenes/jobs/index.jsx
import { Box, Button, Typography, useTheme, Stack } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import AddJobModal from "../../components/add_job_modal";
import ScheduleJobDialog from "../../components/schedule_job_dialog";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
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

  // Columns configuration for the DataGrid, including Actions for admin role
  const columns = [
    {
      field: "job_name",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Job Name"}</Typography>
      ),
      flex: 1.5,
    },
    {
      field: "scheduled_start_time",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>
          {"Scheduled Start Time"}
        </Typography>
      ),
      flex: 1,
    },
    {
      field: "status",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Status"}</Typography>
      ),
      flex: 0.6,
    },
    {
      field: "start_time",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Start Time"}</Typography>
      ),
      flex: 1,
    },
    {
      field: "end_time",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"End Time"}</Typography>
      ),
      flex: 1,
    },
    {
      field: "run_time",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Run Time"}</Typography>
      ),
      flex: 0.5,
    },
    {
      field: "actions",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Actions"}</Typography>
      ),
      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          alignItems={"center"}
          height={"100%"}
        >
          <DeleteIcon
            onClick={() => {
              if (user.role === "Admin") {
                handleDeleteJob(
                  params.row.job_name,
                  params.row.scheduled_start_time
                )
              }
            }}
            sx={{
              cursor: user.role === "Admin" ? "pointer" : "default",
              color: user.role === "Admin" ? colors.redAccent[500] : colors.grey[400],
              alignItems: "center",
            }}
          />
        </Stack>
      ),
      flex: 0.5,
    },
  ];

  // Deletes a job based on job name and scheduled start time if confirmed
  const handleDeleteJob = async (job_name, scheduled_start_time) => {
    if (
      window.confirm(`Are you sure you want to delete the job: ${job_name}?`)
    ) {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`/api/jobs`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ job_name, scheduled_start_time }),
        });

        if (response.ok) {
          fetchData();
        } else {
          console.error("Error deleting job:", response.statusText);
        }
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    }
  };

  // Fetches job data from the server, formats it, and updates the state
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/jobs", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      const formattedData = data.map((jobs, index) => ({
        id: index,
        job_name: jobs.job_name,
        scheduled_start_time: jobs.scheduled_start_time,
        status: jobs.status,
        start_time: jobs.start_time,
        end_time: jobs.end_time,
        run_time: formatRunTime(jobs.run_time),
      }));
      setJobs(formattedData);
    } catch (error) {
      console.error("Error fetching Jobs data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data fetching and set up interval to refresh data every 10 seconds
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Box m="20px">
      <Header
        title="Data Fetch"
        subtitle="Status of Jobs to Fetch Stock Data"
      />
      {/* Add and Schedule Job Buttons */}
      <Box mb={2}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleOpenJobModal}
          startIcon={<AddCircleOutlineIcon />}
          disabled={user.role !== "Admin"}
          style={{ marginRight: "10px" }}
        >
          Add Job
        </Button>
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

      {/* Modals for Adding and Scheduling Jobs */}
      <AddJobModal
        open={openJobModal}
        onClose={handleCloseJobModal}
        onSubmit={handleCloseJobModal}
      />
      <ScheduleJobDialog
        open={openScheduleJobDialog}
        onClose={handleCloseScheduleJobDialog}
      />

      {/* DataGrid for displaying jobs */}
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
