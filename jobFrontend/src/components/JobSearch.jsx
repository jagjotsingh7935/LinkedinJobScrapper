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
  Tabs,
  Tab,
  Tooltip,
  Fade,
  Collapse,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
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
  CalendarToday as CalendarIcon,
  Numbers as NumbersIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime,
  CheckCircle as CheckCircleIcon,
  InfoOutlined as InfoIcon,
  AutoAwesome as SparklesIcon,
} from "@mui/icons-material";
import { searchJobs, saveJob, createJobSchedule, getJobSchedules } from "./api";
import ScheduleTable from "./ScheduleTable";

function JobSearch() {
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [jobLimit, setJobLimit] = useState(10);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);
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
    "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
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
      setError("Please fill in keywords, location, and your alert email.");
      setTimeout(() => setError(null), 5000);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchJobs(keywords, location, email, jobLimit);
      setJobs(data.jobs || []);
      setOpenConfirmDialog(true);
      setSuccess("Job search initiated successfully! Scraped leads are ready.");
      setTimeout(() => setSuccess(null), 5000);
      setKeywords("");
      setLocation("");
      setJobLimit(10);
    } catch (err) {
      setError("Failed to initiate job search. Please verify parameters and try again.");
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
      setError("Please fill in all fields including at least one scheduled day and time.");
      setTimeout(() => setError(null), 5000);
      return;
    }

    setScheduleLoading(true);
    setError(null);

    try {
      await createJobSchedule(
        email,
        keywords,
        location,
        jobLimit,
        selectedDays,
        selectedTimes,
      );

      setOpenScheduleDialog(true);
      setSuccess("Automated search schedule activated successfully!");
      setTimeout(() => setSuccess(null), 5000);

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
      setSuccess("Job bookmarked to your Saved Wishlist!");
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
    setSelectedDays(newDays);
  };

  const handleTimeToggle = (time) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
  };

  const JobSkeleton = () => (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        p: 2.5,
      }}
    >
      <Stack spacing={2} sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Skeleton variant="rectangular" width="70%" height={24} sx={{ borderRadius: 1.5 }} />
          <Skeleton variant="circular" width={32} height={32} />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width="50%" />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width="40%" />
        </Stack>
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1.5 }} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: 5 }} />
          <Skeleton variant="rounded" width={85} height={24} sx={{ borderRadius: 5 }} />
          <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 5 }} />
        </Stack>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 2 }} />
    </Card>
  );

  const JobCard = ({ job }) => {
    const isExpanded = expandedDescription[job.job_id];
    const shouldShowToggle = job.job_description && job.job_description.length > 150;
    const truncatedDesc = job.job_description
      ? job.job_description.slice(0, 150)
      : "No detailed description provided.";

    const isSaved = savedJobs.has(job.job_id);

    return (
      <Fade in={true} timeout={400}>
        <Card
          elevation={0}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            "&:hover": {
              transform: "translateY(-4px)",
              borderColor: "#cbd5e1",
              boxShadow: "0 14px 28px -6px rgba(15, 23, 42, 0.08), 0 6px 10px -4px rgba(15, 23, 42, 0.04)",
            },
          }}
        >
          <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2}>
              {/* Header: Title + Bookmark */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: { xs: "1.05rem", sm: "1.15rem" },
                      lineHeight: 1.35,
                      letterSpacing: "-0.01em",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {job.job_title}
                  </Typography>
                </Box>
                <Tooltip title={isSaved ? "Saved in Wishlist" : "Save Job"}>
                  <IconButton
                    size="small"
                    onClick={() => handleSaveJob(job.job_id)}
                    disabled={isSaved}
                    sx={{
                      color: isSaved ? "#2563eb" : "#94a3b8",
                      backgroundColor: isSaved ? "#eff6ff" : "#f8fafc",
                      border: "1px solid",
                      borderColor: isSaved ? "#bfdbfe" : "#e2e8f0",
                      borderRadius: 2,
                      "&:hover": {
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        borderColor: "#93c5fd",
                      },
                    }}
                  >
                    {isSaved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Company & Location Badges */}
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      bgcolor: "#eff6ff",
                      color: "#2563eb",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {job.company ? job.company.charAt(0).toUpperCase() : "C"}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#334155",
                      fontSize: "0.875rem",
                    }}
                  >
                    {job.company || "Company Confidential"}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <LocationIcon sx={{ color: "#64748b", fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                    {job.location || "Remote / Unspecified"}
                  </Typography>
                </Stack>
              </Stack>

              {/* Description Snippet */}
              <Box sx={{ backgroundColor: "#f8fafc", p: 1.75, borderRadius: 2.5, border: "1px solid #f1f5f9" }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#475569",
                    lineHeight: 1.6,
                    fontSize: "0.85rem",
                  }}
                >
                  {isExpanded ? job.job_description : truncatedDesc}
                  {!isExpanded && shouldShowToggle && "..."}
                </Typography>
                {shouldShowToggle && (
                  <Button
                    size="small"
                    onClick={() => toggleDescription(job.job_id)}
                    endIcon={isExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "#2563eb",
                      p: 0,
                      mt: 0.5,
                      minWidth: "auto",
                      fontSize: "0.8rem",
                      "&:hover": {
                        backgroundColor: "transparent",
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </Button>
                )}
              </Box>

              {/* Skills Chips */}
              {job.skills && job.skills.length > 0 && (
                <Box>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        size="small"
                        sx={{
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          height: 26,
                          borderRadius: "14px",
                          border: "1px solid #dbeafe",
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
                          setSelectedJobTitle(job.job_title);
                          setOpenSkillsDialog(true);
                        }}
                        sx={{
                          backgroundColor: "#f1f5f9",
                          color: "#475569",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          height: 26,
                          borderRadius: "14px",
                          border: "1px solid #e2e8f0",
                          "&:hover": {
                            backgroundColor: "#e2e8f0",
                          },
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>

          <Divider sx={{ borderColor: "#f1f5f9" }} />

          <CardActions sx={{ p: 2, pt: 1.5, display: "flex", gap: 1 }}>
            <Button
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="medium"
              fullWidth
              endIcon={<LaunchIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 600,
                fontSize: "0.875rem",
                py: 0.9,
                backgroundColor: "#2563eb",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                "&:hover": {
                  backgroundColor: "#1d4ed8",
                  boxShadow: "0 6px 16px rgba(37, 99, 235, 0.3)",
                },
              }}
            >
              Apply on LinkedIn
            </Button>
          </CardActions>
        </Card>
      </Fade>
    );
  };

  return (
    <Box sx={{ width: "100%", pb: 6 }}>
      {/* Executive Page Header Banner */}
      <Paper
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2563eb 120%)",
          color: "white",
          p: { xs: 3, sm: 3.5, md: 4 },
          mb: { xs: 3, sm: 3.5 },
          borderRadius: 4,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.25)",
          "&::after": {
            content: '""',
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: "450px",
            height: "450px",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2.5,
          }}
        >
          <Box sx={{ maxWidth: { md: "70%" } }}>
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
                <WorkIcon sx={{ fontSize: { xs: 26, sm: 30 }, color: "#60a5fa" }} />
              </Avatar>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontWeight: 800,
                      color: "#ffffff !important",
                      fontSize: { xs: "1.5rem", sm: "1.85rem", md: "2rem" },
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Job Search & Scraper
                  </Typography>
                  <Chip
                    icon={<SparklesIcon sx={{ fontSize: "14px !important", color: "#60a5fa !important" }} />}
                    label="Pro Pipeline"
                    size="small"
                    sx={{
                      backgroundColor: "rgba(59, 130, 246, 0.25)",
                      color: "#93c5fd",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      display: { xs: "none", sm: "inline-flex" },
                    }}
                  />
                </Stack>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#cbd5e1 !important",
                    fontSize: { xs: "0.875rem", sm: "0.975rem" },
                    maxWidth: 650,
                  }}
                >
                  Extract real-time postings directly from LinkedIn or set up automated scheduled alerts delivered straight to your email.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack
            direction={{ xs: "row", md: "column" }}
            spacing={1}
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
            alignItems={{ xs: "flex-start", md: "flex-end" }}
          >
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: "15px !important", color: "#34d399 !important" }} />}
              label="LinkedIn Scraping Engine Active"
              size="small"
              sx={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "#a7f3d0",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                fontWeight: 600,
              }}
            />
          </Stack>
        </Box>
        </Paper>

        {/* Global Notifications */}
        <Collapse in={Boolean(error || success)}>
          <Box sx={{ mb: 3 }}>
            {error && (
              <Alert
                severity="error"
                onClose={() => setError(null)}
                sx={{ borderRadius: 2.5, fontWeight: 500 }}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                onClose={() => setSuccess(null)}
                sx={{ borderRadius: 2.5, fontWeight: 500 }}
              >
                {success}
              </Alert>
            )}
          </Box>
        </Collapse>

        {/* Mode Selector Tabs */}
        <Paper
          elevation={0}
          sx={{
            mb: { xs: 2.5, sm: 3.5 },
            borderRadius: 3,
            p: 0.75,
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: 48,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                borderRadius: 2,
                minHeight: 46,
                px: 3,
                color: "#64748b",
                transition: "all 0.2s",
                "&.Mui-selected": {
                  color: "#2563eb",
                  backgroundColor: "#eff6ff",
                },
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            <Tab
              icon={<SearchIcon fontSize="small" />}
              iconPosition="start"
              label="Instant Live Search"
            />
            <Tab
              icon={<ScheduleIcon fontSize="small" />}
              iconPosition="start"
              label={`Automated Schedules (${schedules.length})`}
            />
          </Tabs>
        </Paper>

        {/* TAB 0: Instant Search Form */}
        {activeTab === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              mb: { xs: 3, sm: 4 },
              borderRadius: 3.5,
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
            }}
          >
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem" }}>
                Query Parameters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Provide role titles, target location, and your report email to trigger the LinkedIn crawler.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "1.3fr 1.3fr 1fr 0.6fr",
                },
                gap: 2,
                mb: 2.5,
              }}
            >
              <TextField
                label="Job Keywords / Role"
                placeholder="e.g. React Developer, Cloud Architect"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Target Location"
                placeholder="e.g. United States, London, Remote"
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

              <TextField
                label="Delivery Email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Max Postings"
                type="number"
                value={jobLimit}
                onChange={(e) => setJobLimit(Math.max(1, Math.min(200, Number(e.target.value))))}
                fullWidth
                inputProps={{ min: 1, max: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersIcon sx={{ color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !keywords || !location || !email}
              startIcon={loading ? null : <SearchIcon />}
              fullWidth
              sx={{
                borderRadius: 2.5,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 700,
                backgroundColor: "#2563eb",
                boxShadow: "0 6px 20px rgba(37, 99, 235, 0.25)",
                "&:hover": {
                  backgroundColor: "#1d4ed8",
                  boxShadow: "0 8px 25px rgba(37, 99, 235, 0.35)",
                },
              }}
            >
              {loading ? "Crawling LinkedIn Postings..." : "Initiate Live Search"}
            </Button>
          </Paper>
        )}

        {/* TAB 1: Scheduled Search Form & Management */}
        {activeTab === 1 && (
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                mb: { xs: 3, sm: 4 },
                borderRadius: 3.5,
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem" }}>
                  Schedule Recurring Scraper Jobs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set up automated cron scraper jobs that crawl LinkedIn at selected weekly intervals and email reports.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.2fr 1.2fr 1.2fr 140px" },
                  gap: 2.5,
                  mb: 3,
                }}
              >
                <TextField
                  label="Keywords"
                  placeholder="e.g. Senior DevOps, Backend Engineer"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Location"
                  placeholder="e.g. Canada, Germany, Remote"
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

                <TextField
                  label="Notification Email"
                  type="email"
                  placeholder="alerts@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Job Limit"
                  type="number"
                  value={jobLimit}
                  onChange={(e) => setJobLimit(Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 1, max: 200 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NumbersIcon sx={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Day Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#1e293b", mb: 1.25 }}
                >
                  Select Execution Days
                </Typography>
                <ToggleButtonGroup
                  value={selectedDays}
                  onChange={handleDaysChange}
                  multiple
                  fullWidth
                  sx={{
                    gap: 1,
                    flexWrap: "wrap",
                    "& .MuiToggleButton-root": {
                      flex: { xs: "1 1 calc(33% - 8px)", sm: "1" },
                      borderRadius: "10px !important",
                      border: "1px solid #e2e8f0 !important",
                      color: "#475569",
                      fontWeight: 600,
                      py: 1.2,
                      textTransform: "none",
                      "&.Mui-selected": {
                        backgroundColor: "#2563eb !important",
                        color: "#ffffff !important",
                        borderColor: "#2563eb !important",
                      },
                      "&:hover": {
                        backgroundColor: "#f1f5f9",
                      },
                    },
                  }}
                >
                  {daysOfWeek.map((day) => (
                    <ToggleButton key={day.value} value={day.value}>
                      {day.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {/* Time Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#1e293b", mb: 1.25 }}
                >
                  Select Execution Times (UTC / 24-Hour Slots)
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    maxHeight: "180px",
                    overflowY: "auto",
                    p: 1.5,
                    border: "1px solid #e2e8f0",
                    borderRadius: 2.5,
                    backgroundColor: "#f8fafc",
                  }}
                >
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTimes.includes(slot);
                    return (
                      <Chip
                        key={slot}
                        label={slot}
                        onClick={() => handleTimeToggle(slot)}
                        sx={{
                          fontWeight: 600,
                          minWidth: 72,
                          height: 34,
                          borderRadius: "8px",
                          backgroundColor: isSelected ? "#2563eb" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#475569",
                          border: "1px solid",
                          borderColor: isSelected ? "#2563eb" : "#cbd5e1",
                          "&:hover": {
                            backgroundColor: isSelected ? "#1d4ed8" : "#f1f5f9",
                          },
                        }}
                      />
                    );
                  })}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                  <AccessTime sx={{ color: "#64748b", fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    Active Slots:{" "}
                    {selectedTimes.length === 0 ? (
                      <span style={{ color: "#94a3b8" }}>None selected</span>
                    ) : (
                      <strong>{selectedTimes.join(", ")}</strong>
                    )}
                  </Typography>
                </Stack>
              </Box>

              <Box>
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
                    borderRadius: 2.5,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 700,
                    backgroundColor: "#0f172a",
                    "&:hover": {
                      backgroundColor: "#1e293b",
                    },
                  }}
                >
                  {scheduleLoading ? "Configuring Schedule..." : "Save Automated Schedule"}
                </Button>
              </Box>
            </Paper>

            <ScheduleTable
              schedules={schedules}
              onUpdate={(updatedSchedule) => {
                setSchedules((prev) =>
                  prev.map((s) => (s.id === updatedSchedule.id ? { ...s, ...updatedSchedule } : s)),
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
          </Box>
        )}

        {/* Live Search Results Header & Grid */}
        {jobs.length > 0 && activeTab === 0 && (
          <Box sx={{ mt: 4 }}>
            <Box
              sx={{
                mb: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ bgcolor: "#eff6ff", color: "#2563eb", width: 42, height: 42 }}>
                  <TrendingUpIcon sx={{ fontSize: 22 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
                    Scraped Job Opportunities
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Displaying {jobs.length} freshly extracted listings
                  </Typography>
                </Box>
              </Stack>

              <Chip
                icon={<InfoIcon sx={{ fontSize: 16 }} />}
                label="Direct LinkedIn Links"
                size="small"
                sx={{ backgroundColor: "#f1f5f9", fontWeight: 600, color: "#475569" }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: { xs: 2, sm: 2.5, md: 3 },
              }}
            >
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <JobSkeleton key={index} />
                  ))
                : jobs.map((job) => (
                    <JobCard job={job} key={job.job_id} />
                  ))}
            </Box>
          </Box>
        )}

        {/* Suggested Templates When No Active Search Run (Covers empty space) */}
        {jobs.length === 0 && !loading && activeTab === 0 && (
          <Box>
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                Popular Role Search Presets
              </Typography>
              <Typography variant="body2" color="#64748b">
                Click any suggestion to pre-fill keywords, target region, and max job limit
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2.5,
                mb: 4,
              }}
            >
              {[
                { title: "Senior React Developer", kw: "React Developer", loc: "Remote", limit: 20 },
                { title: "Cloud & DevOps Architect", kw: "DevOps Kubernetes", loc: "United States", limit: 15 },
                { title: "Python Backend Lead", kw: "Python Django FastAPI", loc: "Remote", limit: 20 },
                { title: "Fullstack AI Engineer", kw: "Fullstack LLM AI", loc: "San Francisco, CA", limit: 15 },
                { title: "Data Analyst & Scientist", kw: "Data Science Python", loc: "New York, NY", limit: 15 },
                { title: "Product Designer (UI/UX)", kw: "Product Designer Figma", loc: "Remote", limit: 10 },
              ].map((template, idx) => (
                <Card
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      borderColor: "#2563eb",
                      boxShadow: "0 8px 20px rgba(37, 99, 235, 0.08)",
                    },
                  }}
                  onClick={() => {
                    setKeywords(template.kw);
                    setLocation(template.loc);
                    setJobLimit(template.limit);
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: "#eff6ff", color: "#2563eb" }}>
                      <SparklesIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                      {template.title}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="#475569" display="block">
                    <strong>Keywords:</strong> {template.kw}
                  </Typography>
                  <Typography variant="caption" color="#64748b" display="block" sx={{ mb: 1.5 }}>
                    <strong>Region:</strong> {template.loc} • <strong>Limit:</strong> {template.limit}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ p: 0, fontSize: "0.8rem", fontWeight: 600, color: "#2563eb" }}
                  >
                    Fill Parameters &rarr;
                  </Button>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Dialog: Search Confirmation */}
        <Dialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            elevation: 0,
            sx: { borderRadius: 3.5, p: 1 },
          }}
        >
          <DialogTitle sx={{ textAlign: "center", fontWeight: 700, pt: 3 }}>
            <Avatar
              sx={{
                bgcolor: "#eff6ff",
                color: "#2563eb",
                width: 56,
                height: 56,
                mx: "auto",
                mb: 1.5,
              }}
            >
              <EmailIcon sx={{ fontSize: 28 }} />
            </Avatar>
            Search Executed Successfully
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center", px: 4 }}>
            <Typography variant="body1" sx={{ color: "#475569", lineHeight: 1.6 }}>
              Your LinkedIn job scraper task was processed. Results have been displayed below, and an Excel report will be compiled for your records.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1, justifyContent: "center" }}>
            <Button
              onClick={() => setOpenConfirmDialog(false)}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                fontWeight: 600,
                backgroundColor: "#2563eb",
              }}
            >
              View Results
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog: Schedule Confirmation */}
        <Dialog
          open={openScheduleDialog}
          onClose={() => setOpenScheduleDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            elevation: 0,
            sx: { borderRadius: 3.5, p: 1 },
          }}
        >
          <DialogTitle sx={{ textAlign: "center", fontWeight: 700, pt: 3 }}>
            <Avatar
              sx={{
                bgcolor: "#ecfdf5",
                color: "#10b981",
                width: 56,
                height: 56,
                mx: "auto",
                mb: 1.5,
              }}
            >
              <CalendarIcon sx={{ fontSize: 28 }} />
            </Avatar>
            Scraper Schedule Activated
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center", px: 4 }}>
            <Typography variant="body1" sx={{ color: "#475569", lineHeight: 1.6 }}>
              Your automated scraper is now registered. The background worker will run queries on your selected days/times and email fresh jobs.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1, justifyContent: "center" }}>
            <Button
              onClick={() => setOpenScheduleDialog(false)}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                fontWeight: 600,
                backgroundColor: "#0f172a",
              }}
            >
              Understood
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog: All Skills */}
        <Dialog
          open={openSkillsDialog}
          onClose={() => setOpenSkillsDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            elevation: 0,
            sx: { borderRadius: 3.5, p: 1 },
          }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
                Identified Competencies & Skills
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedJobTitle}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenSkillsDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: "#f1f5f9", py: 3 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {selectedSkills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  sx={{
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    fontWeight: 600,
                    borderRadius: "16px",
                    border: "1px solid #dbeafe",
                  }}
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenSkillsDialog(false)} sx={{ fontWeight: 600 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
}

export default JobSearch;
