// src/components/edit_api_key_modal.jsx
import React, { useState } from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { tokens } from "../theme";
import { useTheme } from "@mui/material/styles";

const EditApiKeyModal = ({ open, onClose, apiKey, onSubmit }) => {
  // Initialize state with the current API key (if available) for editing
  const [api_key, setApiKey] = useState(apiKey?.api_key || "");
  
  // Access the theme and color tokens for consistent styling
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Handler for submitting the updated API key
  const handleSubmit = () => {
    // Submit the new API key only if the service name and API key are provided
    if (apiKey && api_key) {
      onSubmit(apiKey.service, api_key); // Call onSubmit with the service and new API key
    }
  };

  return (
    // Dialog component for modal display, controlled by the 'open' prop
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit API Key</DialogTitle>
      <DialogContent>
        {/* Display the service name as a read-only field */}
        <TextField
          fullWidth
          label="Service"
          value={apiKey?.service || ""}
          slotProps={{ input: { readOnly: true } }}
          margin="normal"
          color={colors.redAccent[500]}
        />

        {/* Editable field for updating the API key */}
        <TextField
          fullWidth
          label="API Key"
          defaultValue={apiKey?.api_key}
          onChange={(e) => setApiKey(e.target.value)}
          margin="normal"
          color={colors.redAccent[500]}
        />
      </DialogContent>
      <DialogActions>
        {/* Button to cancel editing and close the modal */}
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ backgroundColor: colors.grey[500] }}
        >
          Cancel
        </Button>

        {/* Button to submit the updated API key */}
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Update Key
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditApiKeyModal;
