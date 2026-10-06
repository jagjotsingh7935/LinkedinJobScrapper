import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  Divider,
  Stack,
  Avatar,
  CardActions,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Launch as LaunchIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  FileDownload as DownloadIcon,
  Tune as TuneIcon,
  Close as CloseIcon,
  Numbers as NumbersIcon,
  Bolt as BoltIcon,
  CheckCircle as CheckCircleIcon,
  Shield as ShieldIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { restrictSearchJobs, downloadExcel, saveJob } from './api';

function RestrictJobSearch() {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [jobLimit, setJobLimit] = useState(10);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [openDescriptionDialog, setOpenDescriptionDialog] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('');

  const quickPresets = [
    { title: 'Lead Fullstack Engineer', kw: 'Fullstack React Node', loc: 'Remote', limit: 15 },
    { title: 'Python & AI Engineer', kw: 'Python Machine Learning', loc: 'San Francisco, CA', limit: 15 },
    { title: 'Cloud & DevOps Architect', kw: 'DevOps Kubernetes AWS', loc: 'New York, NY', limit: 20 },
    { title: 'Frontend Specialist', kw: 'React TypeScript Next.js', loc: 'Remote', limit: 15 },
    { title: 'Data Platform Engineer', kw: 'Data Engineer SQL Spark', loc: 'London, UK', limit: 15 },
    { title: 'Product Design Lead', kw: 'Product Designer Figma UI', loc: 'Austin, TX', limit: 10 },
  ];

  const handleApplyPreset = (preset) => {
    setKeywords(preset.kw);
    setLocation(preset.loc);
    setJobLimit(preset.limit);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      const data = await restrictSearchJobs(keywords, location, jobLimit);
      setJobs(data.jobs || []);
      setMessage(data.message || (data.jobs?.length > 0 ? `Found ${data.jobs.length} jobs` : 'No matching jobs found'));
    } catch (err) {
      setError('Failed to fetch jobs. Please verify filters and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadExcel(jobs);
    } catch (err) {
      setError('Failed to download Excel file.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      await saveJob(jobId);
      setSavedJobs((prev) => new Set(prev).add(jobId));
      setMessage('Job bookmarked successfully!');
    } catch (err) {
      setError('Failed to bookmark job. Please try again.');
    }
  };

  const JobSkeleton = () => (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3.5,
        border: '1px solid #e2e8f0',
        p: 2.5,
      }}
    >
      <Stack spacing={2} sx={{ flexGrow: 1 }}>
        <Skeleton variant="rectangular" width="75%" height={24} sx={{ borderRadius: 1.5 }} />
        <Stack direction="row" spacing={1} alignItems="center">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width="50%" />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width="40%" />
        </Stack>
        <Skeleton variant="rectangular" width="100%" height={50} sx={{ borderRadius: 1.5 }} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={65} height={24} sx={{ borderRadius: 5 }} />
          <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 5 }} />
        </Stack>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={38} sx={{ borderRadius: 2 }} />
    </Card>
  );

  const JobCard = ({ job }) => {
    const isSaved = savedJobs.has(job.id);
    return (
      <Card
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: '#cbd5e1',
            boxShadow: '0 14px 28px -6px rgba(15, 23, 42, 0.08), 0 6px 10px -4px rgba(15, 23, 42, 0.04)',
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
          <Stack spacing={2}>
            {/* Title & Save Icon */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 700,
                  color: '#0f172a',
                  fontSize: { xs: '1.05rem', sm: '1.15rem' },
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {job.job_title}
              </Typography>
              <Tooltip title={isSaved ? "Saved" : "Save Job"}>
                <IconButton
                  size="small"
                  onClick={() => handleSaveJob(job.id)}
                  disabled={isSaved}
                  sx={{
                    color: isSaved ? '#2563eb' : '#94a3b8',
                    backgroundColor: isSaved ? '#eff6ff' : '#f8fafc',
                    border: '1px solid',
                    borderColor: isSaved ? '#bfdbfe' : '#e2e8f0',
                    borderRadius: 2,
                    '&:hover': { backgroundColor: '#eff6ff', color: '#2563eb' },
                  }}
                >
                  {isSaved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>

            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 24, height: 24, bgcolor: '#eff6ff', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700 }}>
                  {job.company ? job.company.charAt(0).toUpperCase() : 'C'}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {job.company || 'Confidential'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationIcon sx={{ color: '#64748b', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {job.location || 'Location Unspecified'}
                </Typography>
              </Stack>
            </Stack>

            <Box sx={{ backgroundColor: '#f8fafc', p: 1.5, borderRadius: 2, border: '1px solid #f1f5f9' }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#475569',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.5,
                  fontSize: '0.85rem',
                }}
              >
                {job.job_description || 'No detailed description available.'}
              </Typography>
              {job.job_description && job.job_description.length > 150 && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setSelectedDescription(job.job_description);
                    setSelectedJobTitle(job.job_title);
                    setOpenDescriptionDialog(true);
                  }}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#2563eb',
                    p: 0,
                    mt: 0.5,
                    minWidth: 'auto',
                    fontSize: '0.8rem',
                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  Read Full Description
                </Button>
              )}
            </Box>

            {job.skills && job.skills.length > 0 && (
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                {job.skills.slice(0, 3).map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    sx={{
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 26,
                      borderRadius: '14px',
                      border: '1px solid #dbeafe',
                    }}
                  />
                ))}
                {job.skills.length > 3 && (
                  <Chip
                    label={`+${job.skills.length - 3} more`}
                    size="small"
                    clickable
                    onClick={() => {
                      setSelectedSkills(job.skills);
                      setOpenDialog(true);
                    }}
                    sx={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 26,
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      '&:hover': { backgroundColor: '#e2e8f0' },
                    }}
                  />
                )}
              </Stack>
            )}
          </Stack>
        </CardContent>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <CardActions sx={{ p: 2, pt: 1.5 }}>
          {job.job_url ? (
            <Button
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              fullWidth
              endIcon={<LaunchIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                backgroundColor: '#2563eb',
                py: 0.9,
                '&:hover': { backgroundColor: '#1d4ed8' },
              }}
            >
              Apply on LinkedIn
            </Button>
          ) : (
            <Button
              variant="contained"
              fullWidth
              disabled={isSaved}
              onClick={() => handleSaveJob(job.id)}
              startIcon={isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                backgroundColor: isSaved ? '#10b981' : '#2563eb',
                py: 0.9,
              }}
            >
              {isSaved ? 'Saved to Wishlist' : 'Bookmark Job'}
            </Button>
          )}
        </CardActions>
      </Card>
    );
  };

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* Banner with EXPLICIT crystal-clear white text */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1d4ed8 140%)',
          p: { xs: 3, sm: 3.5, md: 4 },
          mb: 3.5,
          borderRadius: 4,
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)',
        }}
      >
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              width: { xs: 52, sm: 60 },
              height: { xs: 52, sm: 60 },
              backdropFilter: 'blur(12px)',
            }}
          >
            <TuneIcon sx={{ fontSize: { xs: 26, sm: 30 }, color: '#60a5fa' }} />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 800,
                color: '#ffffff !important',
                fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2rem' },
                letterSpacing: '-0.02em',
                mb: 0.5,
              }}
            >
              Advanced Target Scraper
            </Typography>
            <Typography variant="body1" sx={{ color: '#cbd5e1 !important', fontSize: '0.95rem' }}>
              Filter LinkedIn postings with precision constraints, extraction limits, and instant Excel export.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Search Parameter Card - Full Width */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 4,
          borderRadius: 3.5,
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
        }}
      >
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} sm={5} md={5}>
            <TextField
              label="Role Keywords"
              placeholder="e.g. Lead Frontend Engineer, Staff DevOps"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={4}>
            <TextField
              label="Geographic Location"
              placeholder="e.g. San Francisco, CA or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={1.5}>
            <TextField
              label="Limit"
              type="number"
              value={jobLimit}
              onChange={(e) => setJobLimit(Math.max(1, Math.min(200, Number(e.target.value))))}
              fullWidth
              inputProps={{ min: 1, max: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NumbersIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={1.5}>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !keywords || !location}
              fullWidth
              sx={{
                height: '52px',
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: '0.95rem',
                backgroundColor: '#2563eb',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                '&:hover': { backgroundColor: '#1d4ed8' },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Filter Jobs'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

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

      {/* Results Header + Download Action */}
      {jobs.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Filtered Matches ({jobs.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Targeted results matching your strict criteria
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={handleDownload}
            disabled={downloading}
            startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2.5,
              borderColor: '#cbd5e1',
              color: '#334155',
              '&:hover': { borderColor: '#2563eb', color: '#2563eb', backgroundColor: '#eff6ff' },
            }}
          >
            Export Results as Excel
          </Button>
        </Box>
      )}

      {/* Job Cards Grid */}
      {jobs.length > 0 && (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} sm={6} lg={4} key={job.id}>
              <JobCard job={job} />
            </Grid>
          ))}
        </Grid>
      )}

      {loading && (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} lg={4} key={index}>
              <JobSkeleton />
            </Grid>
          ))}
        </Grid>
      )}

      {/* When no jobs yet: Suggested Presets & Scraper Feature Overview (COVERS COMPLETE SPACE) */}
      {jobs.length === 0 && !loading && (
        <Box>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              Quick Filter Templates
            </Typography>
            <Typography variant="body2" color="#64748b">
              Select any pre-configured role template below to immediately populate search parameters
            </Typography>
          </Box>

          <Grid container spacing={2.5} mb={4}>
            {quickPresets.map((preset, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      borderColor: '#2563eb',
                      boxShadow: '0 8px 20px rgba(37, 99, 235, 0.08)',
                    },
                  }}
                  onClick={() => handleApplyPreset(preset)}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: '#eff6ff', color: '#2563eb' }}>
                      <BoltIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                      {preset.title}
                    </Typography>
                  </Stack>
                  <Stack spacing={0.75}>
                    <Typography variant="caption" color="#475569">
                      <strong>Keywords:</strong> {preset.kw}
                    </Typography>
                    <Typography variant="caption" color="#64748b">
                      <strong>Location:</strong> {preset.loc} • <strong>Limit:</strong> {preset.limit}
                    </Typography>
                  </Stack>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ p: 0, mt: 1.5, fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}
                  >
                    Apply Template &rarr;
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Engine Highlights Cards */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: '#ecfdf5', color: '#10b981', mb: 1.5 }}>
                  <SpeedIcon />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700} color="#0f172a" mb={0.5}>
                  Instant Extraction Engine
                </Typography>
                <Typography variant="body2" color="#64748b">
                  Extracts live posting titles, company data, and locations directly through high-speed scraping endpoints.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: '#eff6ff', color: '#2563eb', mb: 1.5 }}>
                  <ShieldIcon />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700} color="#0f172a" mb={0.5}>
                  No Account Credentials Required
                </Typography>
                <Typography variant="body2" color="#64748b">
                  Scrapes publicly available postings securely without exposing personal account sessions.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: '#fef3c7', color: '#d97706', mb: 1.5 }}>
                  <DownloadIcon />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700} color="#0f172a" mb={0.5}>
                  Automated Spreadsheet Export
                </Typography>
                <Typography variant="body2" color="#64748b">
                  Generate comprehensive multi-column Excel workbooks ready for applicant tracking and recruiter CRM import.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Dialog: Description */}
      <Dialog
        open={openDescriptionDialog}
        onClose={() => setOpenDescriptionDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ elevation: 0, sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {selectedJobTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Full Role Specifications
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenDescriptionDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#f1f5f9', py: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {selectedDescription}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDescriptionDialog(false)} sx={{ fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Skills */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ elevation: 0, sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Required Competencies
          </Typography>
          <IconButton onClick={() => setOpenDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#f1f5f9', py: 2.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedSkills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                sx={{
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontWeight: 600,
                  borderRadius: '16px',
                  border: '1px solid #dbeafe',
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RestrictJobSearch;