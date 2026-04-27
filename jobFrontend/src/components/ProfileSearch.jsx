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
} from '@mui/material';
import { 
  Person as PersonIcon,
  Launch as LaunchIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { searchProfiles, downloadProfilesExcel } from "./api";

const ProfileSearch = () => {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [maxPages, setMaxPages] = useState(2);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
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

    // Sanitize location: replace commas with spaces and trim
    const sanitizedLocation = location.replace(/,/g, ' ').trim();
    const searchTerm = `${keywords} ${sanitizedLocation}`.trim();

    try {
      const data = await searchProfiles(searchTerm, maxPages);
      console.log('Backend response:', data); // Debug log
      // Ensure profiles is an array
      if (Array.isArray(data)) {
        setProfiles(data);
      } else if (data.warning) {
        setMessage(data.warning);
        setProfiles([]);
      } else {
        throw new Error('Invalid response format: Expected an array of profiles');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch profiles. Please try again.');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await downloadProfilesExcel(profiles);
      setDownloadUrl(response.download_url);
    } catch (err) {
      console.error('Download error:', err);
      setError(err.response?.data?.error || 'Failed to generate Excel file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ProfileSkeleton = () => (
    <Card sx={{ width: "100%", display: "flex", flexDirection: "column", m: 1, height: "100%" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2}>
          <Skeleton variant="text" sx={{ fontSize: "1.5rem" }} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" sx={{ fontSize: "0.875rem" }} />
          <Skeleton variant="text" sx={{ fontSize: "0.875rem" }} />
        </Stack>
      </CardContent>
      <CardActions>
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      </CardActions>
    </Card>
  );

  const ProfileCard = ({ profile }) => (
    <Card
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        m: 1,
        borderRadius: 3,
        height: "100%",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) => theme.shadows[12],
        },
      }}
      elevation={2}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Stack spacing={2}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              color: "#374356",
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {profile.title || 'N/A'}
          </Typography>
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.6,
              }}
            >
              {profile.description || 'N/A'}
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
                  fontWeight: 500,
                  color: "primary.main",
                  p: 0,
                  minWidth: "auto",
                  mt: 1,
                  "&:hover": {
                    backgroundColor: "transparent",
                    textDecoration: "underline",
                  },
                }}
              >
                Read More
              </Button>
            )}
          </Box>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions sx={{ p: 2, pt: 1.5, justifyContent: "flex-end" }}>
        <Button
          href={profile.url}
          target="_blank"
          variant="contained"
          size="medium"
          startIcon={<LaunchIcon />}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 500,
            px: 3,
            backgroundColor: "#293548",
            "&:hover": {
              backgroundColor: "#293548",
              opacity: 0.9,
            },
          }}
        >
          View Profile
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #293548 0%, #334155 100%)",
          color: "white",
          p: 4,
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 48, height: 48 }}
          >
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              LinkedIn Profile Search
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Discover professional profiles
            </Typography>
          </Box>
        </Stack>
      </Paper>
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                label="Keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                required
                fullWidth
                size="medium"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
                size="medium"
                InputProps={{
                  startAdornment: <LocationIcon sx={{ color: "text.secondary", mr: 1 }} />,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Max pages to fetch"
                type="number"
                value={maxPages}
                onChange={(e) => setMaxPages(Math.min(Math.max(Number(e.target.value), 1), 10))}
                inputProps={{ min: 1, max: 10 }}
                fullWidth
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !keywords}
                startIcon={<SearchIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  backgroundColor: "#293548",
                  "&:hover": {
                    backgroundColor: "#293548",
                    opacity: 0.9,
                  },
                  height: "48px",
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {profiles.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadExcel}
            disabled={loading}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              backgroundColor: "#293548",
              "&:hover": {
                backgroundColor: "#293548",
                opacity: 0.9,
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Download as Excel'}
          </Button>
        </Box>
      )}

      {downloadUrl && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography>
            Excel file generated!{' '}
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              Click here to download
            </a>
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {message && !loading && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {loading
          ? Array.from({ length: 10 }).map((_, index) => (
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

      {!loading && profiles.length === 0 && !error && message && (
        <Paper
          elevation={0}
          sx={{
            textAlign: "center",
            py: 10,
            pl: 2,
            pr: 2,
            backgroundColor: "#293548",
            borderRadius: 2,
            color: "white",
          }}
        >
          <PersonIcon sx={{ fontSize: 64, color: "white", mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No profiles found
          </Typography>
          <Typography variant="body2">
            Try adjusting your search criteria to find profiles
          </Typography>
        </Paper>
      )}

      <Dialog
        open={openDescriptionDialog}
        onClose={() => setOpenDescriptionDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #9797979d 100%)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(45deg, #272e38 30%, #313e52 90%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            py: 3,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '2px',
            },
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <PersonIcon />
            Profile Description
          </Box>
        </DialogTitle>
        <DialogContent
          dividers={false}
          sx={{
            p: 0,
            backgroundColor: 'transparent',
          }}
        >
          <Box sx={{ p: 3 }}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(145deg, #ffffff 0%, #f0f2f5 100%)',
                border: '1px solid rgba(33, 150, 243, 0.1)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: '#374356',
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {selectedProfileTitle || 'N/A'}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.primary',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedDescription || 'No description available'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            backgroundColor: 'rgba(245, 247, 250, 0.5)',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Button
            onClick={() => setOpenDescriptionDialog(false)}
            variant="contained"
            size="large"
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #212a37 30%, #313e52 90%)',
              boxShadow: '0 4px 15px rgba(37, 47, 56, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1e242d 30%, #313e52 90%)',
                boxShadow: '0 6px 20px rgba(39, 51, 61, 0.4)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfileSearch;
