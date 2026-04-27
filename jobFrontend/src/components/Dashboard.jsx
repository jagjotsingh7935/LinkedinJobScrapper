import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Container,
  Avatar,
  LinearProgress,
  Stack,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Work as WorkIcon,
  Timeline as TimelineIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import { getDashboardData } from './api';

// Custom Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: { xs: 1, md: 2 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardData();
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, overflowX: 'hidden' }}>
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="50vh"
        >
          <CircularProgress size={isMobile ? 40 : 60} thickness={4} />
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            color="text.secondary" 
            sx={{ mt: 2, textAlign: 'center' }}
          >
            Loading dashboard data...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, overflowX: 'hidden' }}>
        <Alert
          severity="error"
          variant="filled"
          action={
            <IconButton onClick={fetchDashboardData} color="inherit" size="small">
              <RefreshIcon />
            </IconButton>
          }
          sx={{ borderRadius: 2, py: 1 }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, overflowX: 'hidden' }}>
        <Alert severity="warning" variant="filled" sx={{ borderRadius: 2, py: 1 }}>
          No data available. Please try refreshing.
        </Alert>
      </Container>
    );
  }

  const {
    total_searches,
    total_jobs,
    average_jobs_per_search,
    recent_searches,
    top_keywords,
    location_distribution,
    employment_type_distribution,
    recent_jobs,
  } = dashboardData;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: isMobile ? undefined : '2-digit',
      minute: isMobile ? undefined : '2-digit',
    });
  };

  const EnhancedStatCard = ({ title, value, icon, color = 'primary', subtitle, progress }) => (
    <Card
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        bgcolor: alpha(theme.palette[color].main, 0.05),
        border: `1px solid ${alpha(theme.palette[color].main, 0.15)}`,
        borderRadius: 2,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[6],
          bgcolor: alpha(theme.palette[color].main, 0.1),
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, md: 2.5 }, flexGrow: 1 }}>
        <Stack direction="column" spacing={1} alignItems="center" mb={1.5}>
          <Avatar
            sx={{
              bgcolor: theme.palette[color].main,
              width: { xs: 36, sm: 40, md: 48 },
              height: { xs: 36, sm: 40, md: 48 },
            }}
          >
            {icon}
          </Avatar>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="h2" 
            color={color} 
            fontWeight="bold"
            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }, textAlign: 'center' }}
          >
            {value}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, textAlign: 'center' }}
          >
            {subtitle}
          </Typography>
        </Stack>
        <Typography 
          variant={isMobile ? "body2" : "body1"} 
          color="text.primary" 
          fontWeight="medium"
          sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }, textAlign: 'center' }}
        >
          {title}
        </Typography>
        {progress && (
          <Box mt={1.5}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={color}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: alpha(theme.palette[color].main, 0.15),
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const employmentTypeChartOptions = {
    chart: {
      type: 'donut',
      height: isMobile ? 220 : isTablet ? 260 : isLargeScreen ? 400 : 320,
      background: 'transparent',
      fontFamily: theme.typography.fontFamily,
    },
    labels: employment_type_distribution.map((item) => item.employment_type || 'Not Specified'),
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: { width: '100%', height: 220 },
          legend: { position: 'bottom', fontSize: '10px' },
        },
      },
      {
        breakpoint: 960,
        options: {
          chart: { width: '100%', height: 260 },
          legend: { position: 'bottom', fontSize: '11px' },
        },
      },
      {
        breakpoint: 1280,
        options: {
          chart: { width: '100%', height: 400 },
          legend: { position: 'right', fontSize: '12px' },
        },
      },
    ],
    colors: [
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      theme.palette.primary.main,
    ],
    legend: {
      position: isMobile ? 'bottom' : isLargeScreen ? 'right' : 'right',
      horizontalAlign: 'center',
      fontSize: isMobile ? '10px' : isTablet ? '11px' : '12px',
      labels: { colors: theme.palette.text.secondary },
      itemMargin: { horizontal: 6, vertical: 4 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: { show: false },
            value: {
              show: true,
              fontSize: isMobile ? '12px' : isLargeScreen ? '16px' : '14px',
              fontWeight: 600,
              color: theme.palette.text.primary,
              formatter: (val) => `${((val / total_jobs) * 100).toFixed(1)}%`,
            },
            total: {
              show: true,
              label: 'Total Jobs',
              fontSize: isMobile ? '12px' : isLargeScreen ? '16px' : '14px',
              fontWeight: 600,
              color: theme.palette.text.primary,
              formatter: () => `${total_jobs}`,
            },
          },
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (val) => `${val} jobs (${((val / total_jobs) * 100).toFixed(1)}%)`,
        title: { formatter: () => '' },
      },
      style: { fontSize: isMobile ? '10px' : isLargeScreen ? '14px' : '12px' },
    },
  };

  const employmentTypeChartSeries = employment_type_distribution.map((item) => item.count);

  const locationChartOptions = {
    chart: {
      type: 'bar',
      height: isMobile ? 220 : isTablet ? 260 : isLargeScreen ? 400 : 320,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: theme.typography.fontFamily,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: isMobile ? '80%' : isTablet ? '70%' : isLargeScreen ? '50%' : '60%',
        endingShape: 'rounded',
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 0, colors: ['transparent'] },
    xaxis: {
      categories: location_distribution.map((item) => 
        isMobile ? item.location.split(',')[0] : item.location
      ),
      title: { 
        text: 'Locations', 
        style: { 
          fontSize: isMobile ? '12px' : isLargeScreen ? '16px' : '14px', 
          fontWeight: 600, 
          color: theme.palette.text.primary 
        } 
      },
      labels: { 
        style: { 
          fontSize: isMobile ? '10px' : isLargeScreen ? '14px' : '12px', 
          colors: theme.palette.text.secondary 
        }, 
        rotate: isMobile ? -45 : 0 
      },
    },
    yaxis: {
      title: { 
        text: 'Job Count', 
        style: { 
          fontSize: isMobile ? '12px' : isLargeScreen ? '16px' : '14px', 
          fontWeight: 600, 
          color: theme.palette.text.primary 
        } 
      },
      labels: { 
        style: { 
          fontSize: isMobile ? '10px' : isLargeScreen ? '14px' : '12px', 
          colors: theme.palette.text.secondary 
        } 
      },
    },
    fill: { opacity: 1, colors: [theme.palette.primary.main] },
    tooltip: { 
      y: { formatter: (val) => `${val} jobs` }, 
      theme: theme.palette.mode, 
      style: { fontSize: isMobile ? '10px' : isLargeScreen ? '14px' : '12px' } 
    },
    grid: { 
      borderColor: theme.palette.divider, 
      strokeDashArray: 4, 
      padding: { top: 0, right: 10, bottom: 0, left: 10 } 
    },
  };

  const locationChartSeries = [{ name: 'Jobs', data: location_distribution.map((item) => item.count) }];

  const keywordChartOptions = {
    chart: {
      type: 'bar',
      height: isMobile ? 220 : isTablet ? 260 : isLargeScreen ? 400 : 320,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: theme.typography.fontFamily,
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: isMobile ? '60%' : isTablet ? '70%' : isLargeScreen ? '50%' : '70%',
        endingShape: 'rounded',
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      title: { 
        text: 'Search Count', 
        style: { 
          fontSize: isMobile ? '12px' : isLargeScreen ? '16px' : '14px', 
          fontWeight: 600, 
          color: theme.palette.text.primary 
        } 
      },
      labels: { 
        style: { 
          fontSize: isMobile ? '10px' : isLargeScreen ? '14px' : '12px', 
          colors: theme.palette.text.secondary 
        } 
      },
    },
    yaxis: {
      categories: top_keywords.map((item) => item.keyword),
      title: { 
        text: 'Keywords', 
        style: { 
          fontSize: isMobile ? '12px' : isLargeScreen ? '16px' : '14px', 
          fontWeight: 600, 
          color: theme.palette.text.primary 
        } 
      },
      labels: { 
        style: { 
          fontSize: isMobile ? '10px' : isLargeScreen ? '14px' : '12px', 
          colors: theme.palette.text.secondary 
        } 
      },
    },
    fill: { opacity: 1, colors: [theme.palette.success.main] },
    grid: { 
      borderColor: theme.palette.divider, 
      strokeDashArray: 4, 
      padding: { top: 0, right: 10, bottom: 0, left: 10 } 
    },
    tooltip: { 
      theme: theme.palette.mode, 
      style: { fontSize: isMobile ? '10px' : isLargeScreen ? '14px' : '12px' } 
    },
  };

  const keywordChartSeries = [{ name: 'Searches', data: top_keywords.map((item) => item.count) }];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, overflowX: 'hidden' }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          bgcolor: theme.palette.primary.main,
          color: 'white',
          p: { xs: 1.5, sm: 2, md: 3 },
          mb: { xs: 2, md: 3 },
          borderRadius: 2,
          boxShadow: theme.shadows[4],
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: { xs: 36, sm: 40, md: 48 }, 
                height: { xs: 36, sm: 40, md: 48 } 
              }}
            >
              <DashboardIcon />
            </Avatar>
            <Box>
              <Typography 
                variant={isMobile ? "h6" : isTablet ? "h5" : "h4"} 
                component="h1" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 0.5, 
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } 
                }}
              >
                Job Search Dashboard
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.9, 
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } 
                }}
              >
                Real-time insights for your job search
              </Typography>
            </Box>
          </Stack>
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={fetchDashboardData}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                p: { xs: 0.8, md: 1 },
              }}
              aria-label="Refresh dashboard data"
            >
              <RefreshIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} mb={{ xs: 2, md: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="Total Searches"
            value={total_searches}
            subtitle="Searches Performed"
            icon={<SearchIcon />}
            color="primary"
            progress={(total_searches / 20) * 100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="Total Jobs Found"
            value={total_jobs}
            subtitle="Opportunities Discovered"
            icon={<WorkIcon />}
            color="secondary"
            progress={(total_jobs / 200) * 100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="Avg Jobs per Search"
            value={average_jobs_per_search.toFixed(1)}
            subtitle="Search Efficiency"
            icon={<TimelineIcon />}
            color="success"
            progress={(average_jobs_per_search / 15) * 100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="Recent Activity"
            value={recent_searches.length}
            subtitle="Recent Searches"
            icon={<ScheduleIcon />}
            color="info"
            progress={(recent_searches.length / 10) * 100}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card 
        elevation={3} 
        sx={{ 
          borderRadius: 2, 
          mb: { xs: 2, md: 3 }, 
          overflowX: 'hidden', 
          boxShadow: theme.shadows[4] 
        }}
      >
        <Box 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            bgcolor: theme.palette.grey[50], 
            p: { xs: 1, md: 1.5 } 
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                color: 'text.secondary',
                minHeight: { xs: 40, md: 48 },
                px: { xs: 1, md: 2 },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  bgcolor: 'white',
                  borderRadius: 1,
                },
              },
              '& .MuiTabs-indicator': { 
                backgroundColor: theme.palette.primary.main, 
                height: 3 
              },
            }}
          >
            <Tab 
              icon={<DashboardIcon fontSize={isMobile ? "small" : "medium"} />} 
              iconPosition="start" 
              label="Overview" 
              sx={{ minWidth: { xs: 80, md: 120 } }} 
              aria-label="Overview tab"
            />
            <Tab 
              icon={<BarChartIcon fontSize={isMobile ? "small" : "medium"} />} 
              iconPosition="start" 
              label="Analytics" 
              sx={{ minWidth: { xs: 80, md: 120 } }} 
              aria-label="Analytics tab"
            />
            <Tab 
              icon={<TableChartIcon fontSize={isMobile ? "small" : "medium"} />} 
              iconPosition="start" 
              label="Data Tables" 
              sx={{ minWidth: { xs: 80, md: 120 } }} 
              aria-label="Data Tables tab"
            />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: { xs: 1.5, md: 3 }, pb: { xs: 1.5, md: 3 }, overflowX: 'hidden' }}>
            <Grid container spacing={{ xs: 1.5, md: 3 }}>
              <Grid item xs={12} lg={6}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%', 
                    borderRadius: 2, 
                    overflowX: 'hidden',
                    boxShadow: theme.shadows[3] 
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                      <LocationIcon color="primary" fontSize={isMobile ? "small" : "medium"} />
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
                      >
                        Jobs by Location
                      </Typography>
                    </Stack>
                    <Chart
                      options={locationChartOptions}
                      series={locationChartSeries}
                      type="bar"
                      height={isMobile ? 220 : isTablet ? 260 : isLargeScreen ? 400 : 320}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%', 
                    borderRadius: 2, 
                    overflowX: 'hidden',
                    boxShadow: theme.shadows[3] 
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                      <GroupIcon color="primary" fontSize={isMobile ? "small" : "medium"} />
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
                      >
                        Employment Types
                      </Typography>
                    </Stack>
                    <Chart
                      options={employmentTypeChartOptions}
                      series={employmentTypeChartSeries}
                      type="donut"
                      height={isMobile ? 220 : isTablet ? 260 : isLargeScreen ? 400 : 320}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ px: { xs: 1.5, md: 3 }, pb: { xs: 1.5, md: 3 }, overflowX: 'hidden' }}>
            <Grid container spacing={{ xs: 1.5, md: 3 }}>
              <Grid item xs={12} lg={8}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    borderRadius: 2, 
                    overflowX: 'hidden',
                    boxShadow: theme.shadows[3] 
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                      <TrendingUpIcon color="success" fontSize={isMobile ? "small" : "medium"} />
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
                      >
                        Top Search Keywords
                      </Typography>
                    </Stack>
                    <Chart
                      options={keywordChartOptions}
                      series={keywordChartSeries}
                      type="bar"
                      height={isMobile ? 220 : isTablet ? 260 : isLargeScreen ? 400 : 320}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%', 
                    borderRadius: 2, 
                    overflowX: 'hidden',
                    boxShadow: theme.shadows[3] 
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                      <DateRangeIcon color="info" fontSize={isMobile ? "small" : "medium"} />
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
                      >
                        Recent Activity
                      </Typography>
                    </Stack>
                    <Stack spacing={1.5}>
                      {recent_searches.slice(0, 5).map((search) => (
                        <Box
                          key={search.id}
                          sx={{
                            p: 1.5,
                            bgcolor: alpha(theme.palette.info.main, 0.05),
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                                width: { xs: 28, md: 32 },
                                height: { xs: 28, md: 32 },
                              }}
                            >
                              <SearchIcon fontSize="small" />
                            </Avatar>
                            <Box flex={1}>
                              <Typography 
                                variant="body2" 
                                fontWeight="medium" 
                                sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}
                              >
                                {search.keywords} in {search.location}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' } }}
                              >
                                {formatDate(search.created_at)} • {search.job_count} jobs
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Data Tables Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ px: { xs: 1.5, md: 3 }, pb: { xs: 1.5, md: 3 }, overflowX: 'hidden' }}>
            <Grid container spacing={{ xs: 1.5, md: 3 }}>
              <Grid item xs={12} lg={6}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    borderRadius: 2, 
                    overflowX: 'hidden',
                    boxShadow: theme.shadows[3] 
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      gutterBottom 
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
                    >
                      Search History
                    </Typography>
                    <TableContainer 
                      sx={{ 
                        maxHeight: { xs: 240, sm: 280, md: 320, lg: 400 }, 
                        bgcolor: 'background.paper', 
                        overflowX: 'hidden' 
                      }}
                    >
                      <Table stickyHeader size={isMobile ? "small" : "medium"}>
                        <TableHead>
                          <TableRow>
                            <TableCell 
                              sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: theme.palette.grey[100], 
                                fontSize: { xs: '0.8rem', md: '0.9rem' } 
                              }}
                            >
                              Keywords
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: theme.palette.grey[100], 
                                fontSize: { xs: '0.8rem', md: '0.9rem' } 
                              }}
                            >
                              Location
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: theme.palette.grey[100], 
                                fontSize: { xs: '0.8rem', md: '0.9rem' } 
                              }}
                            >
                              Jobs Found
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 'bold', 
                                bgcolor: theme.palette.grey[100], 
                                fontSize: { xs: '0.8rem', md: '0.9rem' } 
                              }}
                            >
                              Date
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recent_searches.map((search, index) => (
                            <TableRow
                              key={search.id}
                              hover
                              sx={{ 
                                bgcolor: index % 2 ? alpha(theme.palette.primary.main, 0.03) : 'background.paper',
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                              }}
                            >
                              <TableCell>
                                <Chip
                                  label={search.keywords}
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                    fontSize: { xs: '0.7rem', md: '0.8rem' },
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' } }}
                                >
                                  {search.location || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={search.job_count}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                    color: theme.palette.secondary.main,
                                    fontSize: { xs: '0.7rem', md: '0.8rem' },
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' } }}
                                >
                                  {formatDate(search.created_at)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    borderRadius: 2, 
                    overflowX: 'hidden',
                    boxShadow: theme.shadows[3] 
                  }}
                >
                  <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      gutterBottom 
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
                    >
                      Recent Job Listings
                    </Typography>
                    <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                      <TableContainer 
                        sx={{ 
                          maxHeight: { xs: 240, sm: 280, md: 320, lg: 400 }, 
                          bgcolor: 'background.paper', 
                        }}
                      >
                        <Table stickyHeader size={isMobile ? "small" : "medium"}>
                          <TableHead>
                            <TableRow>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  bgcolor: theme.palette.grey[100], 
                                  fontSize: { xs: '0.8rem', md: '0.9rem' } 
                                }}
                              >
                                Job Title
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  bgcolor: theme.palette.grey[100], 
                                  fontSize: { xs: '0.8rem', md: '0.9rem' } 
                                }}
                              >
                                Company
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  bgcolor: theme.palette.grey[100], 
                                  fontSize: { xs: '0.8rem', md: '0.9rem' } 
                                }}
                              >
                                Posted
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {recent_jobs.map((job, index) => (
                              <TableRow
                                key={job.id}
                                hover
                                sx={{ 
                                  bgcolor: index % 2 ? alpha(theme.palette.primary.main, 0.03) : 'background.paper',
                                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                }}
                              >
                                <TableCell>
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="medium"
                                    sx={{ fontSize: { xs: '0.75rem', md: '0.9rem' } }}
                                  >
                                    {job.job_title}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.7rem', md: '0.8rem' } }}
                                  >
                                    {job.location}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <BusinessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary"
                                      sx={{ fontSize: { xs: '0.75rem', md: '0.9rem' } }}
                                    >
                                      {job.company}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' } }}
                                  >
                                    {job.posted_date}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Card>
    </Container>
  );
};

export default Dashboard;