// src/scenes/api_keys/index.jsx
import { Box, Stack, useTheme, Typography, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "../../components/header";
import AddApiKeyModal from "../../components/add_api_key_modal";
import EditApiKeyModal from "../../components/edit_api_key_modal";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";


const ApiKeys = () => {
  // Theme and state hooks for managing colors and API key data
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openApiKeyModal, setOpenApiKeyModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState(null);
  const navigate = useNavigate();
  // Handlers for opening and closing Add and Edit modals
  const handleOpenApiKeyModal = () => setOpenApiKeyModal(true);
  const handleCloseApiKeyModal = () => setOpenApiKeyModal(false);
  const handleOpenEditModal = (apiKey) => {
    setSelectedApiKey(apiKey);
    setOpenEditModal(true);
  };
  const handleCloseEditModal = () => setOpenEditModal(false);

  const fetchData = useCallback(async () => {
    const fetchWithAuth = async (url, options) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.status === 401) {
        navigate("/login");
        throw new Error("Unauthorized");
      }
      return response;
    };

    try {
      const response = await fetchWithAuth("/api/keys", { method: "GET" });
      const data = await response.json();
      const formattedData = data.map((api, index) => ({
        id: index,
        service: api.service,
        api_key: api.api_key,
        created_at: api.created_at,
        updated_at: api.updated_at,
      }));
      setApiKeys(formattedData);
    } catch (error) {
      console.error("Error fetching API keys:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]); 

  const handleAddApiKey = useCallback(async (newApiKey) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/keys`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newApiKey),
      });

      if (response.ok) {
        fetchData(); // Refresh the API keys list
        handleCloseApiKeyModal(); // Close the modal after adding
      } else {
        console.error("Error adding API key:", response.statusText);
      }
    } catch (error) {
      console.error("Error adding API key:", error);
    }
  }, [fetchData]);

  const handleUpdateApiKey = useCallback(async (service, updatedApiKey) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/keys/${service}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedApiKey),
      });

      if (response.ok) {
        fetchData(); // Refresh the API keys list
        handleCloseEditModal(); // Close the modal after updating
      } else {
        console.error("Error updating API key:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating API key:", error);
    }
  }, [fetchData]);

  const handleDeleteApiKey = useCallback(async (service) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/keys/${service}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        fetchData();
      } else {
        console.error("Error deleting API key:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
    }
  }, [fetchData]);
  
  // Column definitions for the DataGrid
  const columns = useMemo(() => [
    {
      field: "service",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Service"}</Typography>
      ),
      flex: 1.5,
    },
    {
      field: "api_key",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"API Key"}</Typography>
      ),
      flex: 1,
    },
    {
      field: "created_at",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Created"}</Typography>
      ),
      flex: 1,
    },
    {
      field: "updated_at",
      renderHeader: () => (
        <Typography sx={{ fontWeight: "bold" }}>{"Updated"}</Typography>
      ),
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (params) => (
        <Stack direction="row" alignItems={"center"} height={"100%"}>
          {/* Edit button for opening the Edit modal */}
          <Button
            onClick={() => handleOpenEditModal(params.row)}
            sx={{
              cursor: "pointer",
              color: colors.redAccent[500],
              alignItems: "center",
            }}
          >
            <EditIcon />
          </Button>
          {/* Delete button for deleting API key */}
          <Button
            onClick={() => handleDeleteApiKey(params.row.service)}
            sx={{
              cursor: "pointer",
              color: colors.redAccent[500],
              alignItems: "center",
            }}
          >
            <DeleteIcon />
          </Button>
        </Stack>
      ),
      flex: 0.5,
    },
  ], [colors.redAccent, handleDeleteApiKey]);



  // Fetch data on component mount and refresh every 30 seconds
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  return (
    <Box m="20px">
      <Header title="API Keys" subtitle="API Keys for Data Providers" />
      <Box mb={2}>
        {/* Button to open the Add API Key modal */}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleOpenApiKeyModal}
          startIcon={<AddCircleOutlineIcon />}
        >
          Add API Key
        </Button>
      </Box>
      <AddApiKeyModal
        open={openApiKeyModal}
        onClose={handleCloseApiKeyModal}
        onSubmit={handleAddApiKey}
      />
      <EditApiKeyModal
        open={openEditModal}
        onClose={handleCloseEditModal}
        apiKey={selectedApiKey}
        onSubmit={handleUpdateApiKey}
      />
      <Box
        m="40px 0 0 0"
        s
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
        <DataGrid rows={apiKeys} columns={columns} loading={loading} />
      </Box>
    </Box>
  );
};

export default ApiKeys;
