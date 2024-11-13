// src/components/header.jsx
import { Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../theme";

const Header = ({ title, subtitle }) => {
  // Access the current theme to dynamically adjust colors based on theme mode (e.g., light or dark)
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const titleColor = colors.grey[100]

  return (
    // Box component for layout and spacing
    <Box mb="30px">
      {/* Title displayed with larger, bold typography */}
      <Typography
        variant="h2"
        color={titleColor}
        fontWeight="bold"
        sx={{ mb: "5px" }}
      >
        {title}
      </Typography>

      {/* Subtitle displayed with smaller, bold typography and different color */}
      <Typography
        variant="h5"
        color={colors.greenAccent[400]}
        fontWeight="bold"
      >
        {subtitle}
      </Typography>
    </Box>
  );
};

export default Header;
