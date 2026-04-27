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
  IconButton,
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
} from "@mui/material";
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Bookmark as BookmarkIcon,
  Launch as LaunchIcon,
  Star as StarIcon,
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
  const [pageSize, setPageSize] = useState(5);
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
      console.log("API Response:", data);
      setJobs(data.results || []);
      setTotalPages(data.num_pages || 1);
      setMessage(
        data.count > 0
          ? `${data.count} saved jobs found`
          : "No saved jobs found"
      );
    } catch (err) {
      setError("Failed to fetch saved jobs. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, 1000);

  useEffect(() => {
    setPage(1); // Reset page to 1 when filters or pageSize change
    debouncedSearch(keywords, location, 1, pageSize);
    return () => debouncedSearch.cancel();
  }, [keywords, location, pageSize]);

  useEffect(() => {
    debouncedSearch(keywords, location, page, pageSize);
    return () => debouncedSearch.cancel();
  }, [page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(event.target.value);
  };

  const JobSkeleton = () => (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
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
          <Stack direction="row" spacing={1}>
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
      <CardActions>
        <Skeleton
          variant="rectangular"
          width={100}
          height={36}
          sx={{ borderRadius: 1 }}
        />
      </CardActions>
    </Card>
  );

  const JobCard = ({ job }) => (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) => theme.shadows[8],
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
            {job.job.job_title}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <BusinessIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {job.job.company}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary">
              {job.job.location}
            </Typography>
          </Stack>
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.5,
              }}
            >
              {job.job.job_description || "No description available"}
            </Typography>
            {job.job.job_description && job.job.job_description.length > 150 && (
              <Button
                variant="text"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDescription(job.job.job_description);
                  setSelectedJobTitle(job.job.job_title);
                  setOpenDescriptionDialog(true);
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  color: "primary.main",
                  p: 0,
                  minWidth: "auto",
                  mt: 0.5,
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
          {job.job.skills && job.job.skills.length > 0 && (
            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                {job.job.skills.slice(0, 3).map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{
                      backgroundColor: "primary.50",
                      borderColor: "primary.200",
                      "&:hover": {
                        backgroundColor: "primary.100",
                      },
                    }}
                  />
                ))}
                {job.job.skills.length > 3 && (
                  <Chip
                    label={`+${job.job.skills.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ color: "text.secondary" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDialog(true);
                      setSelectedSkills(job.job.skills);
                    }}
                  />
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
      <Divider />
      <CardActions sx={{ p: 2, pt: 1.5 }}>
        <Button
          href={job.job.job_url}
          target="_blank"
          variant="contained"
          size="medium"
          startIcon={<LaunchIcon />}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 500,
            flex: 1,
            backgroundColor: "#293548",
            "&:hover": {
              backgroundColor: "#293548",
              opacity: 0.9,
            },
          }}
        >
          View Job
        </Button>
        <IconButton
          color="primary"
          sx={{
            backgroundColor: "primary.50",
            "&:hover": {
              backgroundColor: "primary.100",
            },
          }}
        >
          {/* <BookmarkIcon /> */}
        </IconButton>
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
            <WorkIcon />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              Saved Jobs
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage and search through your saved job opportunities
            </Typography>
          </Box>
        </Stack>
      </Paper>
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              fullWidth
              size="medium"
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
              size="medium"
              InputProps={{
                startAdornment: (
                  <LocationIcon sx={{ color: "text.secondary", mr: 1 }} />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2} width={210}>
            <FormControl fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
              <InputLabel id="page-size-label">Jobs per page</InputLabel>
              <Select
                labelId="page-size-label"
                value={pageSize}
                onChange={handlePageSizeChange}
                label="Jobs per page"
                size="medium"
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              {loading && <CircularProgress size={24} />}
            </Box>
          </Grid>
        </Grid>
      </Paper>
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
      {!loading && jobs.length === 0 && !error && (
        <Paper
          elevation={0}
          sx={{
            textAlign: "center",
            py: 8,
            backgroundColor: "#293548",
            borderRadius: 2,
          }}
        >
          <WorkIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No saved jobs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or save some jobs to get started
          </Typography>
        </Paper>
      )}
      {totalPages > 1 && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            sx={{
              "& .MuiPaginationItem-root": {
                borderRadius: 2,
                color: "black",
                "&:hover": {
                  opacity: 0.9,
                },
                "&.Mui-selected": {
                  backgroundColor: "#293548",
                  color: "white",
                },
              },
            }}
          />
        </Box>
      )}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
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
            <StarIcon />
            Skills & Expertise
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
            {selectedSkills.length > 0 ? (
              <Grid container spacing={2}>
                {selectedSkills.map((skill, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      elevation={2}
                      sx={{
                        transition: 'all 0.3s ease-in-out',
                        cursor: 'pointer',
                        borderRadius: 2,
                        background: 'linear-gradient(145deg, #ffffff 0%, #f0f2f5 100%)',
                        border: '1px solid rgba(33, 150, 243, 0.1)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(33, 150, 243, 0.15)',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              backgroundColor: 'primary.main',
                              fontSize: '0.875rem',
                            }}
                          >
                            {skill.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="body1"
                            fontWeight={500}
                            sx={{
                              color: 'text.primary',
                              fontSize: '0.95rem',
                            }}
                          >
                            {skill}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                py={6}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: 'grey.100',
                    mb: 2,
                  }}
                >
                  <WorkIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Skills Added
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Skills will appear here once they are selected
                </Typography>
              </Box>
            )}
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
            onClick={() => setOpenDialog(false)}
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
            <WorkIcon />
            Job Description
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
                  {selectedJobTitle}
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
}

export default SavedJobs;