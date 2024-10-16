import React, { Component } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TextField, TableSortLabel, Box, CircularProgress, Button } from '@mui/material';
import axios from 'axios'; // Add Axios for API calls
import styles from '../css/AbletonProjectsTable.module.css';

// Base API URL from environment variable
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

class AbletonProjectsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [], // Dynamically load project names from backend
      searchTerm: '',
      sortConfig: {
        key: null,
        direction: 'asc',
      },
      loading: true,
      fileCount: 0,
    };
  }

  // Fetch the ALS project files and tempo from the server on component mount
  componentDidMount() {
    this.fetchProjectFiles();
  }

  // Handle opening file explorer
  handleOpenExplorer = async (filePath) => {
    try {
      // Send a POST request to the backend to open File Explorer at the specified path
      await axios.post(`${apiUrl}/open-explorer`, { filePath });
      console.log(`Opening File Explorer at: ${filePath}`);
    } catch (error) {
      console.error('Error opening File Explorer:', error);
    }
  };

  // CSV Export functionality
  exportToCsv = async () => {
    try {
      // Send a request to the backend to download the CSV file
      const response = await axios.get(`${apiUrl}/export-csv`, {
        responseType: 'blob', // Get the response as a Blob for file download
      });

      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ableton_projects.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  fetchProjectFiles = async () => {
    this.setState({ loading: true });  // Set loading state to true before fetching
    try {
      const startPath = localStorage.getItem('startPath');
      if (!startPath) {
        console.error('START_PATH not found in local storage');
        return;
      }

      console.log('Using START_PATH:', startPath);

      // Send the START_PATH to the backend as a query parameter
      const response = await axios.get(`${apiUrl}/search`, { params: { startPath } });

      const files = response.data.files.map((file) => {
        const projectName = file.path.split(/[/\\]/).pop().replace('.als', '');
        const fileDate = new Date(file.date);
        const formattedDate = `${fileDate.getFullYear()}.${String(fileDate.getMonth() + 1).padStart(2, '0')}.${String(fileDate.getDate()).padStart(2, '0')}`;
        return {
          projectName: projectName || 'N/A',
          tempo: file.tempo || 'N/A',
          date: formattedDate || 'N/A',
          path: file.path,
          wavsUsed: ['N/A'],
        };
      });

      this.setState({ projects: files, fileCount: files.length, loading: false });
    } catch (error) {
      console.error('Error fetching project files:', error);
      this.setState({ loading: false });
    }
  };

  // Handle search input changes
  handleSearchChange = (event) => {
    this.setState({ searchTerm: event.target.value });
  };

  // Handle sorting changes
  handleSort = (key) => {
    const { sortConfig } = this.state;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;  // Reset sorting
    }
    this.setState({
      sortConfig: { key, direction },
    });
  };

  // Sort the projects based on the sortConfig
  getSortedProjects = (projects) => {
    const { sortConfig } = this.state;
    if (!sortConfig.key || !sortConfig.direction) return projects;

    const sortedProjects = [...projects];
    sortedProjects.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (Array.isArray(aValue)) aValue = aValue[0] || '';
      if (Array.isArray(bValue)) bValue = bValue[0] || '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedProjects;
  };

  // Filter projects based on search term (case-insensitive)
  getFilteredProjects = (projects) => {
    const { searchTerm } = this.state;
    if (!searchTerm) return projects;
    return projects.filter((project) =>
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  render() {
    const { projects, searchTerm, sortConfig, loading, fileCount } = this.state;

    // Apply both filtering and sorting to projects
    const filteredProjects = this.getFilteredProjects(projects);
    const sortedProjects = this.getSortedProjects(filteredProjects);

    return (
      <div>
        {/* <Typography variant="h6" color="white" gutterBottom>
          Found Ableton Projects
        </Typography> */}

        {/* Conditionally show description text only when loading */}
        {loading && (
          <Typography variant="body1" className={styles['dashboard-description']}>
            This dashboard displays all your Ableton Live project files along with their tempo, modified date, samples used.<br/>
            Lean back, have a beer or a smoke while we are searching...
          </Typography>
        )}

        {/* Search Input and Total Projects Found side by side */}
        <Box display="flex" alignItems="center" justifyContent="space-between" className={styles['search-container']}>
          <TextField
            label="Search Projects"
            variant="outlined"
            value={searchTerm}
            onChange={this.handleSearchChange}
            className={styles['search-input']}
            InputProps={{
              className: styles['search-input'],
            }}
          />

          {/* Total Projects Found  and Export CSV*/}
          {!loading && (
            <Typography className={styles['total-projects']}>
              Total Projects Found: {fileCount}
            </Typography>
          )}
          {!loading && (
            <Button
            className={styles['export-button']}
            onClick={() => window.open(`${apiUrl}/export-csv`, '_blank')}
          >
              Export CSV
            </Button>
          )}
        </Box>

        {/* Show loading spinner while data is being fetched */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <div>
            {/* Projects Table */}
            <TableContainer component={Paper} className={styles['table-container']}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className={styles['table-header-cell']}>
                      <TableSortLabel
                        active={sortConfig.key === 'projectName'}
                        direction={sortConfig.direction === 'asc' ? 'asc' : 'desc'}
                        onClick={() => this.handleSort('projectName')}
                      >
                        Project Name
                      </TableSortLabel>
                    </TableCell>

                    <TableCell className={styles['table-header-cell']}>
                      <TableSortLabel
                        active={sortConfig.key === 'date'}
                        direction={sortConfig.direction === 'asc' ? 'asc' : 'desc'}
                        onClick={() => this.handleSort('date')}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>

                    <TableCell className={styles['table-header-cell']}>
                      <TableSortLabel
                        active={sortConfig.key === 'tempo'}
                        direction={sortConfig.direction === 'asc' ? 'asc' : 'desc'}
                        onClick={() => this.handleSort('tempo')}
                      >
                        Tempo
                      </TableSortLabel>
                    </TableCell>

                    <TableCell className={styles['table-header-cell']}>Path to Project</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No projects found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedProjects.map((project, index) => (
                      <TableRow key={index}>
                        <TableCell className={styles['table-cell']}>{project.projectName}</TableCell>
                        <TableCell className={styles['table-cell']}>{project.date}</TableCell>
                        <TableCell className={styles['table-cell']}>{project.tempo}</TableCell>
                        <TableCell className={styles['table-cell']}>
                          <button
                            className={styles['project-link']}
                            onClick={() => this.handleOpenExplorer(project.path)}
                          >
                            {project.path}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}
      </div>
    );
  }
}

export default AbletonProjectsTable;
