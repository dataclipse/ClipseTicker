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
  const [api_key, setApiKey] = useState(apiKey?.api_key || "");
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleSubmit = () => {
    if (apiKey && api_key) {
      onSubmit(apiKey.service, api_key);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit API Key</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Service"
          value={apiKey?.service || ""}
          slotProps={{ input: { readOnly: true } }}
          margin="normal"
          color={colors.redAccent[500]}
        />
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
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ backgroundColor: colors.grey[500] }}
        >
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Update Key
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditApiKeyModal;
