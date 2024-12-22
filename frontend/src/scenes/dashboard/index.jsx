// src/scenes/dashboard/index.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/header";
import { useAuth } from "../../context/auth_context";
import axios from 'axios';

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuth();
  const [rssItems, setRssItems] = useState([]);
  const [error, setError] = useState(null); 

  useEffect(() => {
    const fetchRssFeed = async () => {
      try {
        // Get the authentication token from local storage
        const token = localStorage.getItem('auth_token');

        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch RSS feed from backend
        const response = await axios.get('/api/rss/marketwatch', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setRssItems(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching MarketWatch RSS feed:', error);
        setError('Could not fetch news feed');
      }
    };

    fetchRssFeed();
    const intervalId = setInterval(fetchRssFeed, 60000); // Fetch every minute

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Box m="20px">
      {/* Header section with a title, welcome message, and a download button */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Dashboard" subtitle={`Welcome ${user?.username}`} />
      </Box>

      {/* Main grid section containing statistic boxes and placeholders for charts */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* Row 1 */}
        <Box
          gridColumn="span 12"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          p="10px"
        >
          <Typography
            variant="h5"
            fontWeight="600"
            color={colors.grey[100]}
          >
            Biggest Gainers of the Day
          </Typography>
        </Box>
        {/* Row 2 */}
        <Box
          gridColumn="span 8"
          gridRow={`span ${rssItems.length > 0 ? Math.ceil(rssItems.length / 3) + 2 : 2}`}
          backgroundColor={colors.primary[400]}
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex "
            justifyContent="space-between"
            alignItems="center"
          >
            <Box width="100%">
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
                mb="15px"
              >
                MarketWatch News
              </Typography>
              {error ? (
                <Typography color={colors.redAccent[500]}>
                  {error}
                </Typography>
              ) : (
                rssItems.map((item, index) => (
                  <Box
                    key={index}
                    mb="9px"
                    mt="9px"
                    pb="18px"
                    borderBottom={`1px solid ${colors.grey[100]}`}
                  >
                    <Typography
                      variant="h6"
                      color={colors.greenAccent[400]}
                      onClick={() => window.open(item.link, '_blank')}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color={colors.grey[100]}>
                      {item.pubDate}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
            Database Stats
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
