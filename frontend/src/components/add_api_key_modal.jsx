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
  const [service, setService] = useState("");
  const [api_key, setApiKey] = useState("");
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleSubmit = () => {
    if (service && api_key) {
      onSubmit(service, api_key);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add API Key</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          margin="normal"
          color={colors.redAccent[500]}
        />
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
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ backgroundColor: colors.grey[500] }}
        >
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Add Key
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddApiKeyModal;
