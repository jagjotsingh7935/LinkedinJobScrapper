import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Sidebar from './components/Sidebar';
import { DrawerContext } from './components/DrawerContext';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 60;

function App() {
  const { isDrawerOpen } = useContext(DrawerContext);

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          pt:0,
          width: { sm: `calc(100% - ${isDrawerOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH}px)` },
          transition: 'width 0.3s ease',
          '@media (max-width:600px)': { width: '100%', p: 2 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default App;