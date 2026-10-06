import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Stack,
  Button,
  Skeleton,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
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
  Launch as LaunchIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import { getDashboardData } from './api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardData();
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError('Unable to connect to the backend server. Please verify your Render service is running.');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Modern Stat Card
  const ModernStatCard = ({ title, value, subtitle, icon, gradient, trendText, trendColor = 'success' }) => (
    <Card
      sx={{
        height: '100%',
        p: 0.5,
        borderRadius: 3.5,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.08)',
          borderColor: '#cbd5e1',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              background: gradient,
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            }}
          >
            {icon}
          </Avatar>
          {trendText && (
            <Chip
              label={trendText}
              size="small"
              color={trendColor}
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: '0.72rem', height: 24, borderRadius: 2 }}
            />
          )}
        </Stack>
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.25 }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  // Loading Skeleton State
  if (loading) {
    return (
      <Box sx={{ width: '100%', pb: 6 }}>
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3.5, mb: 3 }} />
        <Grid container spacing={2.5} mb={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3.5 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3.5 }} />
      </Box>
    );
  }

  // Error State with Modern CTA
  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3.5,
            border: '1px solid #fee2e2',
            backgroundColor: '#fff5f5',
            textAlign: 'center',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          <Avatar sx={{ width: 56, height: 56, bgcolor: '#ef4444', color: '#fff', mx: 'auto', mb: 2 }}>
            <ErrorIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight={700} color="#991b1b" gutterBottom>
            Backend Connection Issue
          </Typography>
          <Typography variant="body2" color="#7f1d1d" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={fetchDashboardData}
              sx={{ px: 3 }}
            >
              Retry Connection
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/job-search')}
            >
              Go to Job Search
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  const {
    total_searches = 0,
    total_jobs = 0,
    average_jobs_per_search = 0,
    recent_searches = [],
    top_keywords = [],
    location_distribution = [],
    employment_type_distribution = [],
    recent_jobs = [],
  } = dashboardData || {};

  // Employment Types Donut Chart
  const employmentTypeChartOptions = {
    chart: {
      type: 'donut',
      fontFamily: theme.typography.fontFamily,
      toolbar: { show: false },
    },
    labels: employment_type_distribution.length > 0
      ? employment_type_distribution.map((item) => item.employment_type || 'Not Specified')
      : ['Full-time', 'Part-time', 'Contract'],
    colors: ['#2563eb', '#38bdf8', '#10b981', '#f59e0b', '#8b5cf6'],
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Jobs',
              fontSize: '14px',
              fontWeight: 600,
              color: '#64748b',
              formatter: () => `${total_jobs}`,
            },
          },
        },
      },
    },
    stroke: { width: 0 },
    legend: { position: 'bottom', fontSize: '12px', labels: { colors: '#64748b' } },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `${val} jobs` },
    },
  };

  const employmentTypeChartSeries = employment_type_distribution.length > 0
    ? employment_type_distribution.map((item) => item.count)
    : [60, 25, 15];

  // Location Distribution Bar Chart
  const locationChartOptions = {
    chart: {
      type: 'bar',
      fontFamily: theme.typography.fontFamily,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '55%',
      },
    },
    colors: ['#2563eb'],
    dataLabels: { enabled: false },
    xaxis: {
      categories: location_distribution.length > 0
        ? location_distribution.map((item) => item.location.split(',')[0])
        : ['USA', 'Canada', 'Remote', 'UK'],
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 500 } },
    },
    yaxis: {
      labels: { style: { colors: '#64748b', fontSize: '11px' } },
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    tooltip: { theme: 'dark', y: { formatter: (val) => `${val} jobs` } },
  };

  const locationChartSeries = [
    {
      name: 'Jobs',
      data: location_distribution.length > 0 ? location_distribution.map((item) => item.count) : [45, 30, 20, 15],
    },
  ];

  // Keywords Bar Chart
  const keywordChartOptions = {
    chart: {
      type: 'bar',
      fontFamily: theme.typography.fontFamily,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: true,
        barHeight: '60%',
      },
    },
    colors: ['#10b981'],
    dataLabels: { enabled: false },
    xaxis: {
      labels: { style: { colors: '#64748b', fontSize: '11px' } },
    },
    yaxis: {
      categories: top_keywords.length > 0
        ? top_keywords.map((item) => item.keyword)
        : ['Python Developer', 'React Engineer', 'Data Analyst', 'DevOps'],
      labels: { style: { colors: '#334155', fontSize: '12px', fontWeight: 600 } },
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    tooltip: { theme: 'dark', y: { formatter: (val) => `${val} searches` } },
  };

  const keywordChartSeries = [
    {
      name: 'Searches',
      data: top_keywords.length > 0 ? top_keywords.map((item) => item.count) : [32, 28, 19, 14],
    },
  ];

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* Modern Gradient Hero Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.12)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Chip
                label="LIVE INTELLIGENCE"
                size="small"
                sx={{
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  fontWeight: 800,
                  fontSize: '0.675rem',
                }}
              />
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Updated just now
              </Typography>
            </Stack>
            <Typography variant="h3" fontWeight={800} sx={{ color: '#ffffff', letterSpacing: '-0.02em', mb: 0.5 }}>
              Talent & Job Intelligence Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 650 }}>
              Real-time LinkedIn scraping feeds, job discovery pipeline metrics, and candidate keyword analytics.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Tooltip title="Refresh Dashboard">
              <IconButton
                onClick={fetchDashboardData}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/job-search')}
              sx={{
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                fontWeight: 700,
                px: 2.5,
              }}
            >
              Start New Search
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Top 4 Metrics Grid */}
      <Grid container spacing={2.5} mb={3.5}>
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Total Searches"
            value={total_searches}
            subtitle="Pipeline Queries Run"
            icon={<SearchIcon />}
            gradient="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
            trendText="+12% Active"
            trendColor="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Harvested Jobs"
            value={total_jobs}
            subtitle="Extracted Postings"
            icon={<WorkIcon />}
            gradient="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
            trendText="+24.8% MoM"
            trendColor="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Avg Yield per Run"
            value={Number(average_jobs_per_search || 0).toFixed(1)}
            subtitle="Listings per Query"
            icon={<TimelineIcon />}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            trendText="Optimal"
            trendColor="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Active Feeds"
            value={recent_searches.length}
            subtitle="Historical Sessions"
            icon={<ScheduleIcon />}
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            trendText="Tracking"
            trendColor="warning"
          />
        </Grid>
      </Grid>

      {/* Modern Card with Styled Tabs */}
      <Card sx={{ borderRadius: 3.5, overflow: 'hidden' }}>
        <Box sx={{ px: 3, pt: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#64748b',
                mr: 1,
                '&.Mui-selected': {
                  color: '#2563eb',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                backgroundColor: '#2563eb',
              },
            }}
          >
            <Tab icon={<DashboardIcon fontSize="small" />} iconPosition="start" label="Overview & Charts" />
            <Tab icon={<BarChartIcon fontSize="small" />} iconPosition="start" label="Top Keywords" />
            <Tab icon={<TableChartIcon fontSize="small" />} iconPosition="start" label="Recent Jobs" />
          </Tabs>
        </Box>

        {/* Tab 1: Overview & Distribution Charts */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: '#eff6ff', color: '#2563eb' }}>
                      <LocationIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Jobs by Location
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Geographic density of discovered postings
                      </Typography>
                    </Box>
                  </Stack>
                  <Chart options={locationChartOptions} series={locationChartSeries} type="bar" height={300} />
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: '#f5f3ff', color: '#8b5cf6' }}>
                      <GroupIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Employment Types
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Full-time, contract, and hybrid breakdown
                      </Typography>
                    </Box>
                  </Stack>
                  <Chart options={employmentTypeChartOptions} series={employmentTypeChartSeries} type="donut" height={300} />
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab 2: Top Search Keywords */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: '#ecfdf5', color: '#10b981' }}>
                      <TrendingUpIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Trending Job Keywords
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Highest query frequency across scraping runs
                      </Typography>
                    </Box>
                  </Stack>
                  <Chart options={keywordChartOptions} series={keywordChartSeries} type="bar" height={320} />
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>
                    Recent Search Queries
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Last logged extraction parameters
                  </Typography>

                  <Stack spacing={1.5}>
                    {recent_searches.slice(0, 5).map((search) => (
                      <Paper
                        key={search.id}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" fontWeight={700} color="#0f172a">
                              {search.keywords}
                            </Typography>
                            <Typography variant="caption" color="#64748b">
                              {search.location || 'Anywhere'} • {formatDate(search.created_at)}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${search.job_count || 0} jobs`}
                            size="small"
                            sx={{ fontWeight: 700, backgroundColor: '#eff6ff', color: '#2563eb' }}
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab 3: Recent Scraped Jobs Table */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Job Opportunity</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Extracted Date</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent_jobs.length > 0 ? (
                    recent_jobs.map((job) => (
                      <TableRow key={job.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                bgcolor: '#eff6ff',
                                color: '#2563eb',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {(job.company || 'J').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} color="#0f172a">
                                {job.job_title}
                              </Typography>
                              <Typography variant="caption" color="#64748b">
                                ID: #{job.job_id || job.id}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <BusinessIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                            <Typography variant="body2" color="#334155" fontWeight={600}>
                              {job.company || 'Unknown Company'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <LocationIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                            <Typography variant="body2" color="#64748b">
                              {job.location || 'Remote'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="#64748b">
                            {job.posted_date || 'Recent'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {job.job_link && (
                            <Tooltip title="View on LinkedIn">
                              <IconButton
                                component="a"
                                href={job.job_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                sx={{ color: '#2563eb', '&:hover': { backgroundColor: '#eff6ff' } }}
                              >
                                <LaunchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="#64748b" mb={1.5}>
                          No recently extracted jobs available.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<SearchIcon />}
                          onClick={() => navigate('/job-search')}
                        >
                          Perform a Job Search
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Dashboard;