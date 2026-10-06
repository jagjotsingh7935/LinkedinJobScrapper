import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  IconButton,
  Box,
  Typography,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  Avatar,
  Chip,
  Fade,
  Paper,
  Stack,
} from '@mui/material';
import {
  WorkOutline as WorkIcon,
  Search as SearchIcon,
  BookmarkBorder as SaveIcon,
  Dashboard as DashboardIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Tune as TuneIcon,
  PeopleOutline as PeopleIcon,
  History as HistoryIcon,
  AutoGraph as AutoGraphIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { DrawerContext } from './DrawerContext';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 76;

const navItems = [
  {
    text: 'Dashboard',
    path: '/',
    icon: <DashboardIcon sx={{ fontSize: 21 }} />,
    tag: null,
  },
  {
    text: 'Job Search',
    path: '/job-search',
    icon: <WorkIcon sx={{ fontSize: 21 }} />,
    tag: 'Live',
    tagColor: '#2563eb',
  },
  {
    text: 'Advanced Search',
    path: '/restrict-search',
    icon: <TuneIcon sx={{ fontSize: 21 }} />,
    tag: 'Filters',
    tagColor: '#7c3aed',
  },
  {
    text: 'Saved Jobs',
    path: '/saved-search',
    icon: <SaveIcon sx={{ fontSize: 21 }} />,
    tag: null,
  },
  {
    text: 'Profile Search',
    path: '/profile-search',
    icon: <PeopleIcon sx={{ fontSize: 21 }} />,
    tag: 'AI',
    tagColor: '#059669',
  },
  {
    text: 'Search History',
    path: '/all-search',
    icon: <HistoryIcon sx={{ fontSize: 21 }} />,
    tag: null,
  },
];

function Sidebar() {
  const { isDrawerOpen, toggleDrawer } = useContext(DrawerContext);
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isCollapsed = !isDrawerOpen;
  const currentWidth = isMobile ? DRAWER_WIDTH : (isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH);

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
        color: '#f8fafc',
      }}
    >
      {/* Brand Header */}
      <Toolbar
        sx={{
          minHeight: '68px !important',
          px: isCollapsed ? 1.5 : 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {!isCollapsed ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              }}
            >
              <AutoGraphIcon sx={{ color: '#ffffff', fontSize: 22 }} />
            </Avatar>
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    lineHeight: 1.2,
                  }}
                >
                  Scraper<span style={{ color: '#38bdf8' }}>Pro</span>
                </Typography>
                <Chip
                  label="v2.5"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    px: 0.25,
                  }}
                />
              </Stack>
              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                LinkedIn Job Intelligence
              </Typography>
            </Box>
          </Box>
        ) : (
          <Avatar
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            }}
          >
            <AutoGraphIcon sx={{ color: '#ffffff', fontSize: 20 }} />
          </Avatar>
        )}

        {!isMobile && (
          <IconButton
            onClick={toggleDrawer}
            size="small"
            sx={{
              color: '#94a3b8',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': {
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        )}
      </Toolbar>

      {/* Navigation List */}
      <Box sx={{ flexGrow: 1, px: 1.5, py: 2 }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, p: 0 }}>
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            const buttonContent = (
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={() => {
                  if (isMobile) toggleDrawer();
                }}
                sx={{
                  borderRadius: 2.5,
                  minHeight: 46,
                  px: isCollapsed ? 1.5 : 2,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.16)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(37, 99, 235, 0.22)'
                      : 'rgba(255, 255, 255, 0.06)',
                    color: '#ffffff',
                    transform: isCollapsed ? 'none' : 'translateX(2px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isCollapsed ? 'unset' : 36,
                    color: isActive ? '#3b82f6' : '#94a3b8',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {!isCollapsed && (
                  <>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#ffffff' : '#cbd5e1',
                      }}
                    />
                    {item.tag && (
                      <Chip
                        label={item.tag}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          backgroundColor: `${item.tagColor}22`,
                          color: item.tagColor,
                          border: `1px solid ${item.tagColor}44`,
                        }}
                      />
                    )}
                  </>
                )}
              </ListItemButton>
            );

            return (
              <ListItem key={item.text} disablePadding>
                {isCollapsed ? (
                  <Tooltip title={item.text} placement="right" arrow>
                    <Box sx={{ width: '100%' }}>{buttonContent}</Box>
                  </Tooltip>
                ) : (
                  buttonContent
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User / Status Bottom Footer */}
      <Box sx={{ p: isCollapsed ? 1.5 : 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        {!isCollapsed ? (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: '#2563eb',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                }}
              >
                JS
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.2,
                  }}
                  noWrap
                >
                  Jagjot Singh
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                  <CircleIcon sx={{ fontSize: 7, color: '#10b981' }} />
                  <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Lead Recruiter
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        ) : (
          <Tooltip title="Jagjot Singh (Online)" placement="right">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: '#2563eb',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                JS
              </Avatar>
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={isDrawerOpen}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: currentWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
            transition: 'width 0.25s ease-in-out',
            '& .MuiDrawer-paper': {
              width: currentWidth,
              boxSizing: 'border-box',
              border: 'none',
              transition: 'width 0.25s ease-in-out',
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}

export default Sidebar;