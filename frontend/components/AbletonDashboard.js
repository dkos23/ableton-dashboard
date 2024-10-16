import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, AppBar, Toolbar, IconButton, Menu, MenuItem, CssBaseline } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import { useRouter } from 'next/router'; 
import AbletonTrackTable from './AbletonTrackTable';
import AbletonProjectsTable from './AbletonProjectsTable';
import styles from '../css/AbletonDashboard.module.css';

// Create a dark theme using Material-UI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      marginBottom: '20px',
    },
  },
});

const AbletonDashboard = () => {
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const router = useRouter(); // Initialize the Next.js router

  useEffect(() => {
    axios.get('/MySong.json')
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    const fetchProjects = async () => {
      try {
        const response = await axios.get('/projects.json');
        setProjects(response.data);
      } catch (err) {
        console.error(err.message);
      }
    };

    fetchProjects();
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle navigation to Settings
  const handleSettingsClick = () => {
    router.push('/settings');
    handleMenuClose();
  };

  if (loading) {
    return <Typography variant="h5">Loading...</Typography>;
  }

  if (error) {
    return <Typography variant="h5" color="error">Error: {error}</Typography>;
  }

  // if (!data || !data.Ableton || !data.Ableton.Tracks) {
  //   return <Typography variant="h5">No data available</Typography>;
  // }

  const { AudioTrack, MidiTrack } = data.Ableton.Tracks;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box className={styles['dashboard-container']}>
        {/* Global AppBar for the menu */}
        <AppBar position="static" className={styles['app-bar']}>
          <Toolbar>
            {/* Menu Icon */}
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              className={styles['menu-button']}
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>

            {/* Title */}
            <Typography variant="h6" className={styles['title']}>
              Ableton Dashboard
            </Typography>

            {/* Additional Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              MenuListProps={{ 'aria-labelledby': 'basic-button' }}
            >
              <MenuItem onClick={handleMenuClose}>Home</MenuItem>
              <MenuItem onClick={handleMenuClose}>Tracks</MenuItem>
              <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Container maxWidth="false" className={styles['dashboard-content']}>
          <Typography variant="h1" className={styles['dashboard-header']}>
            My Ableton Projects
          </Typography>

          {/* Pass the project data as props to the AbletonProjectsTable class component */}
          <AbletonProjectsTable projects={projects} />

          {/* Pass the track data as props to the AbletonTrackTable class component */}
          {/* <AbletonTrackTable audioTracks={AudioTrack} midiTracks={MidiTrack} /> */}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AbletonDashboard;
