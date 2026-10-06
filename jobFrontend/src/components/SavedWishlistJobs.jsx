import React, { useState, useEffect } from "react";
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
  Pagination,
  Container,
  Paper,
  Divider,
  Stack,
  Avatar,
  CardActions,
  Skeleton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Bookmark as BookmarkIcon,
  Launch as LaunchIcon,
  Close as CloseIcon,
  Bookmarks as BookmarksIcon,
} from "@mui/icons-material";
import { searchSavedWishlistJobs } from "./api";
import debounce from "lodash/debounce";

function SavedJobs() {
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [openDescriptionDialog, setOpenDescriptionDialog] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedJobTitle, setSelectedJobTitle] = useState("");

  const debouncedSearch = debounce(async (query, loc, pg, size) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchSavedWishlistJobs(query, loc, pg, size);
      setJobs(data.results || []);
      setTotalPages(data.num_pages || 1);
      setMessage(
        data.count > 0 ? `${data.count} saved opportunities in your wishlist` : ""
      );
    } catch (err) {
      setError("Failed to fetch saved jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, 400);

  useEffect(() => {
    setPage(1);
    debouncedSearch(keywords, location, 1, pageSize);
    return () => debouncedSearch.cancel();
  }, [keywords, location, pageSize]);

  useEffect(() => {
    debouncedSearch(keywords, location, page, pageSize);
    return () => debouncedSearch.cancel();
  }, [page]);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (event) => {
    setPageSize(event.target.value);
  };

  const JobSkeleton = () => (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3.5,
        border: "1px solid #e2e8f0",
        p: 2.5,
      }}
    >
      <Stack spacing={2} sx={{ flexGrow: 1 }}>
        <Skeleton variant="rectangular" width="70%" height={24} sx={{ borderRadius: 1.5 }} />
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
          <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 5 }} />
          <Skeleton variant="rounded" width={75} height={24} sx={{ borderRadius: 5 }} />
        </Stack>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={38} sx={{ borderRadius: 2 }} />
    </Card>
  );

  const JobCard = ({ job }) => (
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
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: "#cbd5e1",
          boxShadow: "0 14px 28px -6px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                fontSize: { xs: "1.05rem", sm: "1.15rem" },
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {job.job_title}
            </Typography>
            <Tooltip title="Saved in Wishlist">
              <Avatar
                sx={{
                  bgcolor: "#eff6ff",
                  color: "#2563eb",
                  width: 32,
                  height: 32,
                  border: "1px solid #bfdbfe",
                }}
              >
                <BookmarkIcon sx={{ fontSize: 18 }} />
              </Avatar>
            </Tooltip>
          </Box>

          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 24, height: 24, bgcolor: "#eff6ff", color: "#2563eb", fontSize: "0.75rem", fontWeight: 700 }}>
                {job.company ? job.company.charAt(0).toUpperCase() : "C"}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>
                {job.company || "Confidential"}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <LocationIcon sx={{ color: "#64748b", fontSize: 18 }} />
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                {job.location || "Remote / Unspecified"}
              </Typography>
            </Stack>
          </Stack>

          <Box sx={{ backgroundColor: "#f8fafc", p: 1.5, borderRadius: 2, border: "1px solid #f1f5f9" }}>
            <Typography
              variant="body2"
              sx={{
                color: "#475569",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.5,
                fontSize: "0.85rem",
              }}
            >
              {job.job_description || "No description provided."}
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
                Read More
              </Button>
            )}
          </Box>

          {job.skills && job.skills.length > 0 && (
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
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
                    setOpenDialog(true);
                  }}
                  sx={{
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    height: 26,
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    "&:hover": { backgroundColor: "#e2e8f0" },
                  }}
                />
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>

      <Divider sx={{ borderColor: "#f1f5f9" }} />

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
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              backgroundColor: "#2563eb",
              py: 0.9,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            Open on LinkedIn
          </Button>
        ) : (
          <Button
            variant="outlined"
            fullWidth
            disabled
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              py: 0.9,
            }}
          >
            Saved Record
          </Button>
        )}
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
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #4338ca 140%)",
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
              <BookmarksIcon sx={{ fontSize: { xs: 26, sm: 30 }, color: "#a5b4fc" }} />
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
                Saved Wishlist & Leads
              </Typography>
              <Typography variant="body1" sx={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                Access and manage your bookmarked LinkedIn job openings anytime.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Filter Bar */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            mb: 4,
            borderRadius: 3.5,
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} sm={5} md={5}>
              <TextField
                label="Search Saved Titles"
                placeholder="Filter by keyword..."
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
            </Grid>

            <Grid item xs={12} sm={4} md={4}>
              <TextField
                label="Filter by Location"
                placeholder="e.g. Remote, Austin..."
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

            <Grid item xs={12} sm={3} md={3}>
              <FormControl fullWidth>
                <InputLabel id="page-size-label">Per Page</InputLabel>
                <Select
                  labelId="page-size-label"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  label="Per Page"
                >
                  <MenuItem value={6}>6 jobs</MenuItem>
                  <MenuItem value={12}>12 jobs</MenuItem>
                  <MenuItem value={24}>24 jobs</MenuItem>
                  <MenuItem value={48}>48 jobs</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, borderRadius: 2.5 }}>
            {error}
          </Alert>
        )}
        {message && !loading && (
          <Alert severity="info" onClose={() => setMessage("")} sx={{ mb: 3, borderRadius: 2.5 }}>
            {message}
          </Alert>
        )}

        {/* Jobs Grid */}
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: pageSize }).map((_, index) => (
                <Grid item xs={12} sm={6} lg={4} key={index}>
                  <JobSkeleton />
                </Grid>
              ))
            : jobs.map((job) => (
                <Grid item xs={12} sm={6} lg={4} key={job.id}>
                  <JobCard job={job} />
                </Grid>
              ))}
        </Grid>

        {/* Clean Empty State */}
        {!loading && jobs.length === 0 && !error && (
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
              <BookmarkIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
              No Saved Jobs Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: "auto" }}>
              Bookmark jobs from the Job Search or Advanced Scraper pages to build your target opportunity list here.
            </Typography>
          </Paper>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ mt: 5, mb: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              shape="rounded"
              sx={{
                "& .MuiPaginationItem-root": {
                  fontWeight: 600,
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        )}

        {/* Dialog: Full Description */}
        <Dialog
          open={openDescriptionDialog}
          onClose={() => setOpenDescriptionDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ elevation: 0, sx: { borderRadius: 3.5, p: 1 } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
                {selectedJobTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Saved Opportunity Overview
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenDescriptionDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: "#f1f5f9", py: 2.5 }}>
            <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.8, whiteSpace: "pre-line" }}>
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
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
              Required Competencies
            </Typography>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: "#f1f5f9", py: 2.5 }}>
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
            <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 600 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default SavedJobs;