import React, { useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  NotificationsNone as NotificationsIcon,
  GitHub as GitHubIcon,
  CloudDone as CloudDoneIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Sidebar from './components/Sidebar';
import { DrawerContext } from './components/DrawerContext';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 76;

const getPageMeta = (pathname) => {
  switch (pathname) {
    case '/job-search':
      return { title: 'Job Search & Scraper', subtitle: 'Search and extract live postings from LinkedIn' };
    case '/restrict-search':
      return { title: 'Advanced Scraper', subtitle: 'Targeted searches with location radius and filters' };
    case '/saved-search':
      return { title: 'Saved Wishlist', subtitle: 'Your bookmarked opportunities and candidate leads' };
    case '/profile-search':
      return { title: 'Profile Search', subtitle: 'Discover targeted professional profiles on LinkedIn' };
    case '/all-search':
      return { title: 'Search History', subtitle: 'Historical search logs and aggregated statistics' };
    default:
      return { title: 'Overview & Analytics', subtitle: 'Live metrics, active schedules and scraped pipeline' };
  }
};

function App() {
  const { isDrawerOpen, toggleDrawer } = useContext(DrawerContext);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const pageMeta = getPageMeta(location.pathname);
  const effectiveDrawerWidth = isMobile ? 0 : (isDrawerOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { xs: '100%', md: `calc(100% - ${effectiveDrawerWidth}px)` },
          minHeight: '100vh',
          transition: 'width 0.25s ease-in-out',
        }}
      >
        {/* Modern Top Header Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #e2e8f0',
            color: '#0f172a',
            zIndex: theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 }, minHeight: 68 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                onClick={toggleDrawer}
                size="small"
                sx={{
                  color: '#475569',
                  backgroundColor: '#f1f5f9',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#e2e8f0' },
                }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>

              <Box>
                <Breadcrumbs
                  separator={<NavigateNextIcon sx={{ fontSize: 14, color: '#94a3b8' }} />}
                  aria-label="breadcrumb"
                  sx={{ '& .MuiBreadcrumbs-ol': { alignItems: 'center' } }}
                >
                  <Link
                    component="button"
                    underline="none"
                    onClick={() => navigate('/')}
                    sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', '&:hover': { color: '#2563eb' } }}
                  >
                    Portal
                  </Link>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                    {pageMeta.title}
                  </Typography>
                </Breadcrumbs>
              </Box>
            </Box>

            {/* Right Action Bar */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Cloud Status Indicator */}
              <Chip
                icon={<CloudDoneIcon sx={{ fontSize: '15px !important', color: '#10b981 !important' }} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <span className="pulse-dot" />
                    <span>Render Online</span>
                  </Box>
                }
                size="small"
                sx={{
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />

              {location.pathname !== '/job-search' && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SearchIcon fontSize="small" />}
                  onClick={() => navigate('/job-search')}
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    fontSize: '0.825rem',
                    py: 0.75,
                    px: 1.75,
                  }}
                >
                  Quick Search
                </Button>
              )}

              <Tooltip title="View on GitHub">
                <IconButton
                  component="a"
                  href="https://github.com/jagjotsingh7935/LinkedinJobScrapper"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ color: '#475569', '&:hover': { color: '#0f172a', backgroundColor: '#f1f5f9' } }}
                >
                  <GitHubIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                }}
              >
                JS
              </Avatar>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Routed Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 2.5, md: 3 },
            width: '100%',
            minHeight: 'calc(100vh - 68px)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default App;