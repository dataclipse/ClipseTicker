import { Box, Button, Typography, useTheme, Stack } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import React, { useState, useEffect } from "react";
import Header from "../../components/header";
import AddJobModal from "../../components/add_job_modal";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { QuickSearchToolbar, formatRunTime } from "../../components/helper";

const Jobs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [Jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openJobModal, setOpenJobModal] = useState(false);
  const handleOpenJobModal = () => setOpenJobModal(true);
  const handleCloseJobModal = () => setOpenJobModal(false);

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
            onClick={() =>
              handleDeleteJob(
                params.row.job_name,
                params.row.scheduled_start_time
              )
            }
            sx={{
              cursor: "pointer",
              color: colors.redAccent[500],
              alignItems: "center",
            }}
          />
        </Stack>
      ),
      flex: 0.5,
    },
  ];

  const handleDeleteJob = async (job_name, scheduled_start_time) => {
    if (
      window.confirm(`Are you sure you want to delete the job: ${job_name}?`)
    ) {
      try {
        const response = await fetch(`/api/jobs`, {
          method: "DELETE",
          headers: {
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

  const fetchData = async () => {
    try {
      const response = await fetch("/api/jobs");
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
      {/* Button to open the modal */}
      <Box mb={2}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleOpenJobModal}
          startIcon={<AddCircleOutlineIcon />}
        >
          Add Job
        </Button>
      </Box>

      {/* Modal Component */}
      <AddJobModal
        open={openJobModal}
        onClose={handleCloseJobModal}
        onSubmit={handleCloseJobModal}
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
