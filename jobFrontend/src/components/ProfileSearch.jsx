import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Launch as LaunchIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Numbers as NumbersIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { searchProfiles, downloadProfilesExcel } from "./api";

const ProfileSearch = () => {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [maxPages, setMaxPages] = useState(2);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [openDescriptionDialog, setOpenDescriptionDialog] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [selectedProfileTitle, setSelectedProfileTitle] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');
    setProfiles([]);
    setDownloadUrl(null);

    const sanitizedLocation = location.replace(/,/g, ' ').trim();
    const searchTerm = `${keywords} ${sanitizedLocation}`.trim();

    try {
      const data = await searchProfiles(searchTerm, maxPages);
      if (Array.isArray(data)) {
        setProfiles(data);
        if (data.length === 0) {
          setMessage('No profiles matched your search term.');
        }
      } else if (data.warning) {
        setMessage(data.warning);
        setProfiles([]);
      } else {
        throw new Error('Invalid response format: Expected an array of profiles');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch profiles. Please try again.');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await downloadProfilesExcel(profiles);
      setDownloadUrl(response.download_url);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate Excel file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const ProfileSkeleton = () => (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3.5,
        border: "1px solid #e2e8f0",
        p: 2.5,
      }}
    >
      <Stack spacing={2} sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={44} height={44} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={18} />
          </Box>
        </Stack>
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1.5 }} />
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 2, ml: "auto" }} />
    </Card>
  );

  const ProfileCard = ({ profile }) => (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3.5,
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "#cbd5e1",
          boxShadow: "0 12px 24px -4px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar
              sx={{
                width: 46,
                height: 46,
                bgcolor: "#eff6ff",
                color: "#2563eb",
                fontWeight: 700,
                fontSize: "1.1rem",
                border: "1px solid #bfdbfe",
              }}
            >
              {profile.title ? profile.title.charAt(0).toUpperCase() : <PersonIcon />}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.3,
                  fontSize: { xs: "1.05rem", sm: "1.15rem" },
                }}
              >
                {profile.title || 'LinkedIn Member'}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ backgroundColor: "#f8fafc", p: 1.75, borderRadius: 2.5, border: "1px solid #f1f5f9" }}>
            <Typography
              variant="body2"
              sx={{
                color: "#475569",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.6,
                fontSize: "0.875rem",
              }}
            >
              {profile.description || 'No summary available.'}
            </Typography>
            {profile.description && profile.description.length > 150 && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setSelectedDescription(profile.description);
                  setSelectedProfileTitle(profile.title);
                  setOpenDescriptionDialog(true);
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#2563eb",
                  p: 0,
                  mt: 0.5,
                  minWidth: "auto",
                  fontSize: "0.8rem",
                  "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                }}
              >
                Read Full Snippet
              </Button>
            )}
          </Box>
        </Stack>
      </CardContent>

      <Divider sx={{ borderColor: "#f1f5f9" }} />

      <CardActions sx={{ p: 2, pt: 1.5, justifyContent: "flex-end" }}>
        <Button
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          size="medium"
          endIcon={<LaunchIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 600,
            px: 2.5,
            py: 0.85,
            backgroundColor: "#2563eb",
            "&:hover": { backgroundColor: "#1d4ed8" },
          }}
        >
          View on LinkedIn
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2.5, sm: 3.5, md: 4 } }}>
        {/* Banner */}
        <Paper
          elevation={0}
          sx={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #4f46e5 140%)",
            color: "white",
            p: { xs: 3, sm: 4 },
            mb: { xs: 3, sm: 4 },
            borderRadius: 4,
            boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.3)",
          }}
        >
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                width: { xs: 52, sm: 60 },
                height: { xs: 52, sm: 60 },
                backdropFilter: "blur(12px)",
              }}
            >
              <BadgeIcon sx={{ fontSize: { xs: 26, sm: 30 }, color: "#a5b4fc" }} />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.6rem", sm: "2rem" },
                  letterSpacing: "-0.02em",
                }}
              >
                LinkedIn Talent & Profile Search
              </Typography>
              <Typography variant="body1" sx={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                Discover key professionals, recruiters, and candidates directly via Google / LinkedIn indexing.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Search Parameter Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 4,
            borderRadius: 3.5,
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Box component="form" onSubmit={handleSearch}>
            <Grid container spacing={2.5} alignItems="center">
              <Grid item xs={12} sm={5} md={5}>
                <TextField
                  label="Keywords / Name / Title"
                  placeholder="e.g. Technical Recruiter, VP Engineering"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <TextField
                  label="Target Location"
                  placeholder="e.g. Toronto, Seattle, Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon sx={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3} md={1.5}>
                <TextField
                  label="Max Pages"
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(Math.max(1, Math.min(10, Number(e.target.value))))}
                  fullWidth
                  inputProps={{ min: 1, max: 10 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NumbersIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12} md={1.5}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading || !keywords}
                  sx={{
                    height: '52px',
                    borderRadius: 2.5,
                    fontWeight: 700,
                    backgroundColor: "#2563eb",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                    "&:hover": { backgroundColor: "#1d4ed8" },
                  }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Excel Export Action */}
        {profiles.length > 0 && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
              Identified Profiles ({profiles.length})
            </Typography>

            <Button
              variant="outlined"
              startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleDownloadExcel}
              disabled={downloading}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 600,
                borderColor: "#cbd5e1",
                color: "#334155",
                "&:hover": { borderColor: "#2563eb", color: "#2563eb", backgroundColor: "#eff6ff" },
              }}
            >
              Download Excel Export
            </Button>
          </Box>
        )}

        {downloadUrl && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 500 }}>
            <Typography variant="body2">
              Excel file generated!{' '}
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#047857', fontWeight: 700 }}>
                Click here to download spreadsheet
              </a>
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, borderRadius: 2.5, fontWeight: 500 }}>
            {error}
          </Alert>
        )}
        {message && !loading && (
          <Alert severity="info" onClose={() => setMessage('')} sx={{ mb: 3, borderRadius: 2.5, fontWeight: 500 }}>
            {message}
          </Alert>
        )}

        {/* Profile Results Grid */}
        <Grid container spacing={2.5}>
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} key={index}>
                  <ProfileSkeleton />
                </Grid>
              ))
            : profiles.length > 0
              ? profiles.map((profile, index) => (
                  <Grid item xs={12} key={index}>
                    <ProfileCard profile={profile} />
                  </Grid>
                ))
              : null}
        </Grid>

        {/* Clean Empty State */}
        {!loading && profiles.length === 0 && !error && message && (
          <Paper
            elevation={0}
            sx={{
              textAlign: "center",
              py: 8,
              px: 3,
              backgroundColor: "#ffffff",
              borderRadius: 3.5,
              border: "2px dashed #cbd5e1",
            }}
          >
            <Avatar
              sx={{
                width: 68,
                height: 68,
                margin: "0 auto",
                mb: 2,
                bgcolor: "#eff6ff",
                color: "#2563eb",
              }}
            >
              <PersonIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
              No Profiles Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: "auto" }}>
              Try broadening your query keywords or adjusting target locations.
            </Typography>
          </Paper>
        )}

        {/* Dialog: Profile Snippet */}
        <Dialog
          open={openDescriptionDialog}
          onClose={() => setOpenDescriptionDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ elevation: 0, sx: { borderRadius: 3.5, p: 1 } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
                {selectedProfileTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Full Profile Snippet
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenDescriptionDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: "#f1f5f9", py: 2.5 }}>
            <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {selectedDescription}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDescriptionDialog(false)} sx={{ fontWeight: 600 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ProfileSearch;
