import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import JobSearch from './components/JobSearch';
import RestrictJobSearch from './components/RestrictJobSearch';
import SavedJobSearch from './components/SavedJobSearch';
import { DrawerProvider } from './components/DrawerContext';
import Dashboard from './components/Dashboard';
import SavedJobs from './components/SavedWishlistJobs';
import ProfileSearch from './components/ProfileSearch';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#293548' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontSize: 14,
    h1: { fontSize: '2rem', fontWeight: 500, '@media (max-width:600px)': { fontSize: '1.5rem' } },
    h2: { fontSize: '1.5rem', fontWeight: 500, '@media (max-width:600px)': { fontSize: '1.25rem' } },
    body1: { fontSize: '1rem', '@media (max-width:600px)': { fontSize: '0.875rem' } },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#f5f5f5',
          '@media (max-width:600px)': { width: '100%' },
        },
      },
    },
  },
});

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DrawerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route path = 'job-search' element={<JobSearch />} />
              <Route path = '/' index element={<Dashboard/>}/> 
              <Route path="restrict-search" element={<RestrictJobSearch />} />
              <Route path="all-search" element={<SavedJobSearch />} />
              <Route path="saved-search" element={<SavedJobs />} />
              <Route path="profile-search" element={<ProfileSearch />} />


            </Route>
          </Routes>
        </BrowserRouter>
      </DrawerProvider>
    </ThemeProvider>
  </React.StrictMode>
);