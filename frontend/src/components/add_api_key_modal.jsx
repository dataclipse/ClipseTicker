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
  const [formData, setFormData] = useState({ service: "", api_key: "" });

  // Get the theme and color tokens
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Handler for submitting the API key
  const handleSubmit = () => {
    // Only submit if both fields are filled
    if (formData.service && formData.api_key) {
      onSubmit(formData.service, formData.api_key); // Trigger the onSubmit function passed as a prop
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          value={formData.service}
          onChange={handleInputChange}
          margin="normal"
          color={colors.redAccent[500]}
        />
        {/* Input field for the API key */}
        <TextField
          fullWidth
          label="API Key"
          value={formData.api_key}
          onChange={handleInputChange}
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
