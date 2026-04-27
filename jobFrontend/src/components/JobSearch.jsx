import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Container,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Tooltip,
  Fade,
  Collapse,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Launch as LaunchIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Numbers as NumbersIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime,
} from "@mui/icons-material";
import { searchJobs, saveJob, createJobSchedule, getJobSchedules } from "./api";
import ScheduleTable from "./ScheduleTable";

function JobSearch() {
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [jobLimit, setJobLimit] = useState(10);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]); // e.g. ["09:00", "17:00"]
  const [jobs, setJobs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [openSkillsDialog, setOpenSkillsDialog] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [openDescriptionDialog, setOpenDescriptionDialog] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedJobTitle, setSelectedJobTitle] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [expandedDescription, setExpandedDescription] = useState({});

  const daysOfWeek = [
    { value: "Monday", label: "Mon" },
    { value: "Tuesday", label: "Tue" },
    { value: "Wednesday", label: "Wed" },
    { value: "Thursday", label: "Thu" },
    { value: "Friday", label: "Fri" },
    { value: "Saturday", label: "Sat" },
    { value: "Sunday", label: "Sun" },
  ];

  const timeSlots = [
    "00:00",
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
  ];

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await getJobSchedules();
      setSchedules(data.data || []);
    } catch (err) {
      console.error("Failed to load schedules");
    }
  };

  const handleSearch = async () => {
    if (!keywords.trim() || !location.trim() || !email.trim()) {
      setError("Please fill in keywords, location, and email.");
      setTimeout(() => setError(null), 5000);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchJobs(keywords, location, email, jobLimit);
      setJobs(data.jobs || []);
      setOpenConfirmDialog(true);
      setSuccess("Job search initiated successfully!");
      setTimeout(() => setSuccess(null), 5000);
      setKeywords("");
      setLocation("");
      setJobLimit(10);
    } catch (err) {
      setError("Failed to initiate job search. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (
      !keywords.trim() ||
      !location.trim() ||
      !email.trim() ||
      selectedDays.length === 0 ||
      selectedTimes.length === 0
    ) {
      setError(
        "Please fill in all fields including at least one day and one time.",
      );
      setTimeout(() => setError(null), 5000);
      return;
    }

    setScheduleLoading(true);
    setError(null);

    try {
      // Send arrays instead of single values
      await createJobSchedule(
        email,
        keywords,
        location,
        jobLimit,
        selectedDays, // ← array
        selectedTimes, // ← array
      );

      setOpenScheduleDialog(true);
      setSuccess("Job schedule created successfully for multiple days/times!");
      setTimeout(() => setSuccess(null), 5000);

      // Reset form
      setKeywords("");
      setLocation("");
      setJobLimit(10);
      setSelectedDays([]);
      setSelectedTimes([]);
      loadSchedules();
    } catch (err) {
      setError("Failed to create job schedule. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      await saveJob(jobId);
      setSavedJobs((prev) => new Set(prev).add(jobId));
      setSuccess("Job saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save job. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const toggleDescription = (jobId) => {
    setExpandedDescription((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const handleDaysChange = (event, newDays) => {
    setSelectedDays(newDays); // newDays is already array
  };

  const handleTimeToggle = (time) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
  };

  const JobSkeleton = () => (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
      elevation={0}
    >
      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Skeleton variant="text" sx={{ fontSize: "1.5rem" }} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width="60%" />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width="40%" />
          </Stack>
          <Skeleton variant="text" sx={{ fontSize: "0.875rem" }} />
          <Skeleton variant="text" sx={{ fontSize: "0.875rem" }} />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Skeleton
              variant="rectangular"
              width={60}
              height={24}
              sx={{ borderRadius: 12 }}
            />
            <Skeleton
              variant="rectangular"
              width={80}
              height={24}
              sx={{ borderRadius: 12 }}
            />
            <Skeleton
              variant="rectangular"
              width={70}
              height={24}
              sx={{ borderRadius: 12 }}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  const JobCard = ({ job }) => {
    const isExpanded = expandedDescription[job.job_id];
    const truncatedDesc = job.job_description?.substring(0, 150) || "";
    const shouldShowToggle =
      job.job_description && job.job_description.length > 150;

    return (
      <Fade in timeout={500}>
        <Card
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.06)",
            position: "relative",
            overflow: "visible",
            "&:hover": {
              transform: "translateY(-8px)",
              boxShadow: "0 12px 40px rgba(41, 53, 72, 0.15)",
              border: "1px solid rgba(41, 53, 72, 0.1)",
            },
          }}
          elevation={0}
        >
          <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: 700,
                    color: "#293548",
                    lineHeight: 1.3,
                    fontSize: { xs: "1rem", sm: "1.15rem" },
                    flex: 1,
                    pr: 1,
                  }}
                >
                  {job.job_title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleSaveJob(job.job_id)}
                  disabled={savedJobs.has(job.job_id)}
                  sx={{
                    color: savedJobs.has(job.job_id)
                      ? "#293548"
                      : "rgba(41, 53, 72, 0.5)",
                    "&:hover": {
                      backgroundColor: "rgba(41, 53, 72, 0.08)",
                    },
                  }}
                >
                  {savedJobs.has(job.job_id) ? (
                    <BookmarkIcon />
                  ) : (
                    <BookmarkBorderIcon />
                  )}
                </IconButton>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <BusinessIcon
                  sx={{ color: "rgba(41, 53, 72, 0.7)", fontSize: 18 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "rgba(41, 53, 72, 0.8)",
                    fontSize: { xs: "0.813rem", sm: "0.875rem" },
                  }}
                >
                  {job.company}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <LocationIcon
                  sx={{ color: "rgba(41, 53, 72, 0.6)", fontSize: 18 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(41, 53, 72, 0.7)",
                    fontSize: { xs: "0.813rem", sm: "0.875rem" },
                  }}
                >
                  {job.location}
                </Typography>
              </Stack>

              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(41, 53, 72, 0.75)",
                    lineHeight: 1.6,
                    fontSize: { xs: "0.813rem", sm: "0.875rem" },
                  }}
                >
                  {isExpanded ? job.job_description : truncatedDesc}
                  {!isExpanded && shouldShowToggle && "..."}
                </Typography>
                {shouldShowToggle && (
                  <Button
                    size="small"
                    onClick={() => toggleDescription(job.job_id)}
                    endIcon={
                      isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "#293548",
                      p: 0,
                      mt: 0.5,
                      minWidth: "auto",
                      fontSize: { xs: "0.75rem", sm: "0.813rem" },
                      "&:hover": {
                        backgroundColor: "transparent",
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {isExpanded ? "Show Less" : "Read More"}
                  </Button>
                )}
              </Box>

              {job.skills && job.skills.length > 0 && (
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ flexWrap: "wrap", gap: 1 }}
                  >
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(41, 53, 72, 0.08)",
                          color: "#293548",
                          fontWeight: 500,
                          fontSize: { xs: "0.688rem", sm: "0.75rem" },
                          height: { xs: 24, sm: 28 },
                          border: "1px solid rgba(41, 53, 72, 0.15)",
                          "&:hover": {
                            backgroundColor: "rgba(41, 53, 72, 0.12)",
                          },
                        }}
                      />
                    ))}
                    {job.skills.length > 3 && (
                      <Chip
                        label={`+${job.skills.length - 3}`}
                        size="small"
                        onClick={() => {
                          setSelectedSkills(job.skills);
                          setOpenSkillsDialog(true);
                        }}
                        sx={{
                          backgroundColor: "#293548",
                          color: "white",
                          fontWeight: 600,
                          fontSize: { xs: "0.688rem", sm: "0.75rem" },
                          height: { xs: 24, sm: 28 },
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "#1e2836",
                          },
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>

          <Divider sx={{ borderColor: "rgba(0,0,0,0.06)" }} />

          <CardActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1 }}>
            <Button
              href={job.job_url}
              target="_blank"
              variant="contained"
              size="medium"
              fullWidth
              endIcon={<LaunchIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 600,
                fontSize: { xs: "0.813rem", sm: "0.875rem" },
                py: { xs: 0.75, sm: 1 },
                backgroundColor: "#293548",
                boxShadow: "0 4px 12px rgba(41, 53, 72, 0.15)",
                "&:hover": {
                  backgroundColor: "#1e2836",
                  boxShadow: "0 6px 16px rgba(41, 53, 72, 0.25)",
                },
              }}
            >
              Apply Now
            </Button>
          </CardActions>
        </Card>
      </Fade>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            background: "linear-gradient(135deg, #293548 0%, #3d4f66 100%)",
            color: "white",
            p: { xs: 3, sm: 4 },
            mb: { xs: 3, sm: 4 },
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              width: "40%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.05))",
              pointerEvents: "none",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <Avatar
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                width: { xs: 56, sm: 64 },
                height: { xs: 56, sm: 64 },
                backdropFilter: "blur(10px)",
              }}
            >
              <WorkIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
            </Avatar>
            <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 0.5,
                  fontSize: { xs: "1.75rem", sm: "2.125rem" },
                }}
              >
                Job Search Portal
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  opacity: 0.95,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                }}
              >
                Find your dream job or schedule automated searches
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Alerts */}
        <Collapse in={Boolean(error || success)}>
          <Box sx={{ mb: 3 }}>
            {error && (
              <Alert
                severity="error"
                onClose={() => setError(null)}
                sx={{ borderRadius: 2, mb: 2 }}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                onClose={() => setSuccess(null)}
                sx={{ borderRadius: 2 }}
              >
                {success}
              </Alert>
            )}
          </Box>
        </Collapse>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 3, overflow: "hidden" }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              backgroundColor: "white",
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.875rem", sm: "1rem" },
                minHeight: { xs: 56, sm: 64 },
                color: "rgba(41, 53, 72, 0.6)",
              },
              "& .Mui-selected": {
                color: "#293548 !important",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#293548",
                height: 3,
              },
            }}
          >
            <Tab
              icon={<SearchIcon />}
              iconPosition="start"
              label="Search Jobs"
            />
            <Tab
              icon={<ScheduleIcon />}
              iconPosition="start"
              label="Schedule Search"
            />
          </Tabs>
        </Paper>

        {/* Search Form */}
        {activeTab === 0 && (
          <Paper
            elevation={0}
            sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 3, sm: 4 }, borderRadius: 3 }}
          >
            <Grid container spacing={{ xs: 2, sm: 2.5 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Keywords"
                  placeholder="e.g., React Developer"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <SearchIcon
                        sx={{ color: "rgba(41, 53, 72, 0.5)", mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#293548",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#293548",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Location"
                  placeholder="e.g., New York"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <LocationIcon
                        sx={{ color: "rgba(41, 53, 72, 0.5)", mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#293548",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#293548",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <EmailIcon
                        sx={{ color: "rgba(41, 53, 72, 0.5)", mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#293548",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#293548",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Job Limit"
                  type="number"
                  value={jobLimit}
                  onChange={(e) => setJobLimit(Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 1, max: 100 }}
                  InputProps={{
                    startAdornment: (
                      <NumbersIcon
                        sx={{ color: "rgba(41, 53, 72, 0.5)", mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#293548",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#293548",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={loading || !keywords || !location || !email}
                  startIcon={loading ? null : <SearchIcon />}
                  fullWidth
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    backgroundColor: "#293548",
                    boxShadow: "0 4px 14px rgba(41, 53, 72, 0.25)",
                    "&:hover": {
                      backgroundColor: "#1e2836",
                      boxShadow: "0 6px 20px rgba(41, 53, 72, 0.35)",
                    },
                    "&:disabled": {
                      backgroundColor: "rgba(41, 53, 72, 0.3)",
                    },
                  }}
                >
                  {loading ? "Searching..." : "Search Jobs"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Schedule Form */}
        {activeTab === 1 && (
          <Paper
            elevation={0}
            sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 3, sm: 4 }, borderRadius: 3 }}
          >
            <Grid container spacing={{ xs: 2, sm: 2.5 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Keywords"
                  placeholder="e.g., React Developer"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <SearchIcon
                        sx={{ color: "rgba(41, 53, 72, 0.5)", mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#293548",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#293548",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Location"
                  placeholder="e.g., New York"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <LocationIcon
                        sx={{ color: "rgba(41, 53, 72, 0.5)", mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#293548",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#293548",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <EmailIcon
                        sx={{ color: "rgba(41, 53, 72, 0.5)", mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#293548",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#293548",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Job Limit"
                  type="number"
                  value={jobLimit}
                  onChange={(e) => setJobLimit(Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 1, max: 100 }}
                  InputProps={{
                    startAdornment: (
                      <NumbersIcon
                        sx={{ color: "rgba(41, 53, 72, 0.5)", mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "#293548",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#293548",
                      },
                    },
                  }}
                />
              </Grid>

              {/* Day Selection – now multiple */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: "#293548",
                    mb: 1.5,
                    fontSize: { xs: "0.875rem", sm: "0.938rem" },
                  }}
                >
                  Select Days
                </Typography>
                <ToggleButtonGroup
                  value={selectedDays} // ← changed from selectedDay → selectedDays (array)
                  onChange={handleDaysChange}
                  multiple // ← important: allow multiple selection
                  fullWidth
                  sx={{
                    gap: { xs: 0.5, sm: 1 },
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                    "& .MuiToggleButton-root": {
                      flex: { xs: "1 1 calc(33% - 8px)", sm: "1" },
                      minWidth: { xs: "calc(33% - 8px)", sm: "auto" },
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      border: "1px solid rgba(41, 53, 72, 0.2)",
                      color: "rgba(41, 53, 72, 0.7)",
                      py: { xs: 1, sm: 1.5 },
                      fontSize: { xs: "0.75rem", sm: "0.813rem" },
                      "&.Mui-selected": {
                        backgroundColor: "#293548",
                        color: "white",
                        "&:hover": { backgroundColor: "#1e2836" },
                      },
                      "&:hover": { backgroundColor: "rgba(41, 53, 72, 0.08)" },
                    },
                  }}
                >
                  {daysOfWeek.map((day) => (
                    <ToggleButton key={day.value} value={day.value}>
                      {day.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>

              {/* Time Selection – now multiple */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: "#293548",
                    mb: 1.5,
                    fontSize: { xs: "0.875rem", sm: "0.938rem" },
                  }}
                >
                  Select Times (multiple allowed)
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    maxHeight: { xs: "180px", sm: "220px" },
                    overflowY: "auto",
                    p: 0.5,
                    border: "1px solid rgba(41,53,72,0.12)",
                    borderRadius: 2,
                    backgroundColor: "rgba(41,53,72,0.02)",
                    "&::-webkit-scrollbar": { width: "6px" },
                    "&::-webkit-scrollbar-track": {
                      background: "rgba(41,53,72,0.05)",
                      borderRadius: 3,
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(41,53,72,0.3)",
                      borderRadius: 3,
                    },
                  }}
                >
                  {timeSlots.map((slot) => (
                    <Chip
                      key={slot}
                      label={slot}
                      onClick={() => handleTimeToggle(slot)}
                      color={
                        selectedTimes.includes(slot) ? "primary" : "default"
                      }
                      variant={
                        selectedTimes.includes(slot) ? "filled" : "outlined"
                      }
                      sx={{
                        fontWeight: 600,
                        minWidth: 76,
                        height: 36,
                        ...(selectedTimes.includes(slot) && {
                          backgroundColor: "#293548",
                          color: "white",
                          "&:hover": { backgroundColor: "#1e2836" },
                        }),
                      }}
                    />
                  ))}
                </Box>
                <Box
                  sx={{
                    mt: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <AccessTime
                    sx={{ color: "rgba(41,53,72,0.7)", fontSize: 20 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Selected:{" "}
                    {selectedTimes.length === 0
                      ? "None"
                      : selectedTimes.join(", ")}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleSchedule}
                  disabled={
                    scheduleLoading ||
                    !keywords.trim() ||
                    !location.trim() ||
                    !email.trim() ||
                    selectedDays.length === 0 ||
                    selectedTimes.length === 0
                  }
                  startIcon={scheduleLoading ? null : <ScheduleIcon />}
                  fullWidth
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    backgroundColor: "#293548",
                    boxShadow: "0 4px 14px rgba(41, 53, 72, 0.25)",
                    "&:hover": {
                      backgroundColor: "#1e2836",
                      boxShadow: "0 6px 20px rgba(41, 53, 72, 0.35)",
                    },
                    "&:disabled": {
                      backgroundColor: "rgba(41, 53, 72, 0.3)",
                    },
                  }}
                >
                  {scheduleLoading ? "Creating Schedule..." : "Create Schedule"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {activeTab === 1 && (
          <ScheduleTable
            schedules={schedules}
            onUpdate={(updatedSchedule) => {
              setSchedules((prev) =>
                prev.map((s) =>
                  s.id === updatedSchedule.id
                    ? { ...s, ...updatedSchedule }
                    : s,
                ),
              );
              setSuccess("Schedule updated successfully!");
              setTimeout(() => setSuccess(null), 4000);
            }}
            onDelete={(deletedId) => {
              setSchedules((prev) => prev.filter((s) => s.id !== deletedId));
              setSuccess("Schedule deleted successfully!");
              setTimeout(() => setSuccess(null), 4000);
            }}
          />
        )}

        {/* Jobs Grid */}
        {jobs.length > 0 && (
          <Box>
            <Box
              sx={{
                mb: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    bgcolor: "#293548",
                    width: 40,
                    height: 40,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "#293548" }}
                  >
                    Job Results
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <Grid item xs={12} sm={6} lg={4} key={index}>
                      <JobSkeleton />
                    </Grid>
                  ))
                : jobs.map((job) => (
                    <Grid item xs={12} sm={6} lg={4} key={job.job_id}>
                      <JobCard job={job} />
                    </Grid>
                  ))}
            </Grid>
          </Box>
        )}

        {/* Empty State */}
        {jobs.length === 0 && !loading && activeTab === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6 },
              textAlign: "center",
              borderRadius: 3,
              border: "2px dashed rgba(41, 53, 72, 0.2)",
            }}
          >
            <Avatar
              sx={{
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                margin: "0 auto",
                mb: 2,
                bgcolor: "rgba(41, 53, 72, 0.08)",
              }}
            >
              <SearchIcon
                sx={{
                  fontSize: { xs: 40, sm: 50 },
                  color: "rgba(41, 53, 72, 0.4)",
                }}
              />
            </Avatar>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#293548", mb: 1 }}
            >
              No Jobs Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Start your job search by entering keywords and location above
            </Typography>
          </Paper>
        )}

        {/* Dialogs */}
        <Dialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            elevation: 0,
            sx: {
              borderRadius: 4,
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #293548 0%, #3d4f66 100%)",
              color: "white",
              textAlign: "center",
              fontWeight: 700,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              py: 3,
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={1}
            >
              <WorkIcon />
              Search Initiated
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center" }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  margin: "0 auto",
                  mb: 2,
                  bgcolor: "rgba(41, 53, 72, 0.1)",
                }}
              >
                <EmailIcon sx={{ fontSize: 40, color: "#293548" }} />
              </Avatar>
              <Typography
                variant="body1"
                sx={{
                  color: "text.primary",
                  lineHeight: 1.7,
                  fontSize: { xs: "0.938rem", sm: "1rem" },
                }}
              >
                Your job search has been queued successfully! Results will be
                sent to your email as an Excel file shortly.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: "center" }}>
            <Button
              onClick={() => setOpenConfirmDialog(false)}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#293548",
                "&:hover": {
                  backgroundColor: "#1e2836",
                },
              }}
            >
              Got It
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openScheduleDialog}
          onClose={() => setOpenScheduleDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            elevation: 0,
            sx: {
              borderRadius: 4,
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #293548 0%, #3d4f66 100%)",
              color: "white",
              textAlign: "center",
              fontWeight: 700,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              py: 3,
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={1}
            >
              <ScheduleIcon />
              Schedule Created
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center" }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  margin: "0 auto",
                  mb: 2,
                  bgcolor: "rgba(41, 53, 72, 0.1)",
                }}
              >
                <CalendarIcon sx={{ fontSize: 40, color: "#293548" }} />
              </Avatar>
              <Typography
                variant="body1"
                sx={{
                  color: "text.primary",
                  lineHeight: 1.7,
                  fontSize: { xs: "0.938rem", sm: "1rem" },
                }}
              >
                Your weekly job search has been scheduled successfully! You'll
                receive automated results at your specified time.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: "center" }}>
            <Button
              onClick={() => setOpenScheduleDialog(false)}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#293548",
                "&:hover": {
                  backgroundColor: "#1e2836",
                },
              }}
            >
              Perfect
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openSkillsDialog}
          onClose={() => setOpenSkillsDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            elevation: 0,
            sx: {
              borderRadius: 4,
              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #293548 0%, #3d4f66 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              py: 2.5,
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <StarIcon />
              Required Skills
            </Box>
            <IconButton
              onClick={() => setOpenSkillsDialog(false)}
              sx={{
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {selectedSkills.map((skill, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid rgba(41, 53, 72, 0.15)",
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(41, 53, 72, 0.12)",
                        borderColor: "#293548",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          backgroundColor: "#293548",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                        }}
                      >
                        {skill.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#293548",
                          fontSize: { xs: "0.875rem", sm: "0.938rem" },
                        }}
                      >
                        {skill}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}

export default JobSearch;
