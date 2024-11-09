// src/components/add_api_key_modal.jsx
import React, { useState } from "react";
import {
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Dialog,
  DialogActions,
} from "@mui/material";
import { tokens } from "../theme";
import { useTheme } from "@mui/material/styles";

const AddApiKeyModal = ({ open, onClose, onSubmit }) => {
  // State hooks for service name and API key input fields
  const [service, setService] = useState("");
  const [api_key, setApiKey] = useState("");

  // Get the theme and color tokens
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Handler for submitting the API key
  const handleSubmit = () => {
    // Only submit if both fields are filled
    if (service && api_key) {
      onSubmit(service, api_key); // Trigger the onSubmit function passed as a prop
    }
  };

  return (
    // Dialog component for the modal window, controlled by the 'open' prop
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add API Key</DialogTitle>
      <DialogContent>
        {/* Input field for the service name */}
        <TextField
          fullWidth
          label="Service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          margin="normal"
          color={colors.redAccent[500]}
        />
        {/* Input field for the API key */}
        <TextField
          fullWidth
          label="API Key"
          value={api_key}
          onChange={(e) => setApiKey(e.target.value)}
          margin="normal"
          color={colors.redAccent[500]}
        />
      </DialogContent>
      <DialogActions>
        {/* Button to close the modal */}
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ backgroundColor: colors.grey[500] }}
        >
          Cancel
        </Button>
        {/* Button to submit the API key */}
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Add Key
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddApiKeyModal;
