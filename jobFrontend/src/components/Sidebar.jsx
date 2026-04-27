import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, IconButton, Box, Typography, Tooltip, useTheme, useMediaQuery,
  Divider, alpha, Avatar, Chip, Fade, Paper, Stack, Fab
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  WorkOutline as WorkIcon, 
  Search as SearchIcon, 
  BookmarkBorder as SaveIcon,
  Business as BusinessIcon,
  KeyboardArrowRight as ArrowIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { DrawerContext } from './DrawerContext';
import Person4Icon from '@mui/icons-material/Person4';
import HistoryIcon from '@mui/icons-material/History';

const DRAWER_WIDTH = 300;
const COLLAPSED_WIDTH = 72;

const SIDEBAR_GRADIENT = {
  main: "linear-gradient(145deg, #1e293b 0%, #334155 100%)",
  glass: "#1e293b",
};

const navItems = [
  { 
    text: 'Dashboard', 
    path: '/', 
    icon: <DashboardIcon />, 
    color: '#040a1546',
    description: 'Overview & Analytics'
  },
  { 
    text: 'Job Search', 
    path: 'job-search', 
    icon: <WorkIcon />, 
    color: '#040a1546',
    description: 'Find new opportunities'
  },
  { 
    text: 'Advanced Search', 
    path: '/restrict-search', 
    icon: <SearchIcon />, 
    color: '#040a1546',
    description: 'Filter & refine results'
  },
  { 
    text: 'Saved Jobs', 
    path: '/saved-search', 
    icon: <SaveIcon />, 
    color: '#040a1546',
    description: 'Your bookmarked jobs'
  },

  { 
    text: 'Profile Search', 
    path: '/profile-search', 
    icon: <Person4Icon />, 
    color: '#040a1546',
    description: 'Search Profiles of Jobs'
  },
];

const bottomNavItems = [
  { 
    text: 'History', 
    path: '/all-search', 
    icon: <HistoryIcon />, 
    color: '#040a1546',
    description: 'Your bookmarked jobs'
  },
];



function Sidebar() {
  const { isDrawerOpen, toggleDrawer } = useContext(DrawerContext);
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // On mobile: completely hide when collapsed, show when expanded
  // On desktop: show collapsed or expanded version
  const isCollapsed = !isDrawerOpen;
  const shouldHideDrawer = isMobile && isCollapsed;
  const drawerWidth = shouldHideDrawer ? 0 : (isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH);

  const drawerStyles = {
    width: drawerWidth,
    flexShrink: 0,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.standard,
    }),
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      boxSizing: 'border-box',
      overflowX: 'hidden',
      background: SIDEBAR_GRADIENT.main,
      color: '#e2e8f0',
      borderRight: 'none',
      boxShadow: shouldHideDrawer ? 'none' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: theme.transitions.create(['width', 'box-shadow'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
      }),
      transform: shouldHideDrawer ? 'translateX(-100%)' : 'translateX(0)',
    },
  };

  const headerStyles = {
    background: `linear-gradient(135deg, ${SIDEBAR_GRADIENT.glass} 0%, #475569 100%)`,
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.1)',
    minHeight: { xs: 64, sm: 72 },
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at 20% 50%, rgba(100, 116, 139, 0.3) 0%, transparent 50%)`,
      pointerEvents: 'none',
    },
  };

  const getNavItemStyles = (isActive, itemColor) => ({
    margin: '6px 12px',
    borderRadius: 3,
    minHeight: 52,
    justifyContent: isCollapsed ? 'center' : 'flex-start',
    px: isCollapsed ? 1.5 : 2,
    position: 'relative',
    overflow: 'hidden',
    transition: theme.transitions.create(['all'], {
      duration: theme.transitions.duration.short,
    }),
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isActive 
        ? `linear-gradient(135deg, ${itemColor} 0%, ${alpha(itemColor, 0.8)} 100%)`
        : 'transparent',
      opacity: isActive ? 1 : 0,
      transition: theme.transitions.create(['opacity'], {
        duration: theme.transitions.duration.short,
      }),
      borderRadius: 3,
    },
    '&:hover': {
      backgroundColor: 'rgba(226, 232, 240, 0.08)',
      transform: 'translateX(4px)',
      '&::before': {
        opacity: 0.1,
        background: `linear-gradient(135deg, ${itemColor} 0%, ${alpha(itemColor, 0.8)} 100%)`,
      },
    },
    '&:hover .nav-arrow': {
      opacity: 1,
      transform: 'translateX(0)',
    },
    ...(isActive && {
      '&::after': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 4,
        height: 24,
        background: '#e2e8f0',
        borderRadius: '0 2px 2px 0',
        boxShadow: '0 0 10px rgba(226, 232, 240, 0.5)',
      },
    }),
  });

  const iconStyles = {
    minWidth: isCollapsed ? 24 : 48,
    color: 'inherit',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  };

  const NavItem = ({ item, isBottom = false }) => {
    const isActive = location.pathname === item.path;
    
    const handleNavClick = () => {
      // Auto-collapse sidebar on mobile when nav item is clicked
      if (isMobile && isDrawerOpen) {
        toggleDrawer();
      }
    };
    
    const itemContent = (
      <ListItemButton
        component={NavLink}
        to={item.path}
        onClick={handleNavClick}
        sx={getNavItemStyles(isActive, item.color)}
      >
        <ListItemIcon sx={iconStyles}>
          {item.icon}
        </ListItemIcon>
        {!isCollapsed && (
          <>
            <ListItemText 
              primary={item.text}
              secondary={!isBottom ? item.description : undefined}
              primaryTypographyProps={{
                fontSize: '0.95rem',
                fontWeight: isActive ? 600 : 500,
                position: 'relative',
                zIndex: 1,
                color: '#e2e8f0',
              }}
              secondaryTypographyProps={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                position: 'relative',
                zIndex: 1,
              }}
            />
            <ArrowIcon 
              className="nav-arrow"
              sx={{ 
                opacity: 0,
                transform: 'translateX(-8px)',
                transition: theme.transitions.create(['opacity', 'transform'], {
                  duration: theme.transitions.duration.short,
                }),
                position: 'relative',
                zIndex: 1,
                color: '#94a3b8',
              }} 
            />
          </>
        )}
      </ListItemButton>
    );

    return isCollapsed ? (
      <Tooltip 
        title={
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {item.text}
            </Typography>
            {item.description && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {item.description}
              </Typography>
            )}
          </Box>
        }
        placement="right"
        arrow
        PopperProps={{
          sx: {
            '& .MuiTooltip-tooltip': {
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: 2,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxWidth: 200,
              border: '1px solid rgba(226, 232, 240, 0.1)',
            },
            '& .MuiTooltip-arrow': {
              color: '#0f172a',
            },
          },
        }}
      >
        {itemContent}
      </Tooltip>
    ) : itemContent;
  };

  const UserProfile = () => (
    <Fade in={!isCollapsed}>
      <Paper
        elevation={0}
        sx={{
          mx: 2,
          mb: 2,
          p: 2,
          borderRadius: 3,
          background: `linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(71, 85, 105, 0.1) 100%)`,
          border: '1px solid rgba(226, 232, 240, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              width: 44, 
              height: 44,
              background: `linear-gradient(135deg, #64748b 0%, #475569 100%)`,
              boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)',
              color: '#e2e8f0',
            }}
          >
            <PersonIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ color: '#e2e8f0' }}>
              Jagjot Singh
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }} noWrap>
              Software Engineer
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );

  const StatsSection = () => (
    <Fade in={!isCollapsed}>
      <Box sx={{ mx: 2, mb: 2 }}>
        {/* <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            icon={<NotificationsIcon />}
            label="3 New"
            size="small"
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              '& .MuiChip-icon': {
                color: '#fca5a5',
              },
            }}
          />
          <Chip
            label="5 Saved"
            size="small"
            sx={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: '#86efac',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
          />
        </Stack> */}
      </Box>
    </Fade>
  );

  return (
    <>
      {/* Floating Menu Button for Mobile when drawer is hidden */}
      {shouldHideDrawer && (
        <Fab
          color="primary"
          size="medium"
          onClick={toggleDrawer}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: theme.zIndex.drawer + 1,
            background: SIDEBAR_GRADIENT.main,
            color: '#e2e8f0',
            boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 10px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(226, 232, 240, 0.1)',
            '&:hover': {
              background: `linear-gradient(145deg, #334155 0%, #475569 100%)`,
              transform: 'scale(1.05)',
            },
            transition: theme.transitions.create(['transform', 'background'], {
              duration: theme.transitions.duration.short,
            }),
          }}
        >
          <MenuIcon />
        </Fab>
      )}

      <Drawer
        variant="permanent"
        sx={drawerStyles}
      >
      <Toolbar sx={headerStyles}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          position: 'relative',
          zIndex: 1,
        }}>
          {!isCollapsed && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{ 
                  width: 36, 
                  height: 36,
                  background: 'rgba(226, 232, 240, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(226, 232, 240, 0.1)',
                }}
              >
                <BusinessIcon sx={{ color: '#e2e8f0' }} />
              </Avatar>
              <Box>
                <Typography 
                  variant="h6" 
                  noWrap
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    letterSpacing: '0.5px',
                    lineHeight: 1.2,
                    color: '#e2e8f0',
                  }}
                >
                  Job Portal
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#94a3b8',
                    fontSize: '0.7rem',
                    letterSpacing: '0.3px',
                  }}
                >
                  Find Your Dream Job
                </Typography>
              </Box>
            </Box>
          )}
          
          <Tooltip 
            title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
            placement="right"
            arrow
          >
            <IconButton 
              onClick={toggleDrawer}
              sx={{ 
                color: '#e2e8f0',
                backgroundColor: 'rgba(226, 232, 240, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(226, 232, 240, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(226, 232, 240, 0.2)',
                  transform: 'scale(1.05)',
                },
                transition: theme.transitions.create(['transform', 'background-color'], {
                  duration: theme.transitions.duration.short,
                }),
              }}
            >
              {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      <Divider sx={{ 
        backgroundColor: 'rgba(226, 232, 240, 0.1)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
      }} />
      
      <Box sx={{ mt: 2, flexGrow: 1 }}>
        <UserProfile />
        <StatsSection />
        
        <List sx={{ padding: 0 }}>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <NavItem item={item} />
            </ListItem>
          ))}
        </List>
      </Box>
      
      {/* Bottom Navigation */}
      <Box sx={{ mt: 'auto', px: 2, pb: 2 }}>
        <Divider sx={{ 
          backgroundColor: 'rgba(226, 232, 240, 0.1)',
          mx: 2,
          mb: 1,
        }} />
        
        <List sx={{ padding: 0 }}>
          {bottomNavItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <NavItem item={item} isBottom={true} />
            </ListItem>
          ))}
        </List>
        
        {!isCollapsed && (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ 
              color: '#64748b',
              fontSize: '0.7rem',
              letterSpacing: '0.5px',
            }}>
              Job Portal v1.0.0
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
    </>
  );
}

export default Sidebar;