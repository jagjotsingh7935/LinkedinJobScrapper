// components/ScheduleTable.jsx
import React, { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Grid,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Numbers as NumbersIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { updateJobSchedule, deleteJobSchedule } from "./api";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

const ScheduleTable = ({ schedules, onUpdate, onDelete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const startEdit = (schedule) => {
    setEditingId(schedule.id);
    setFormData({
      keywords: schedule.keywords,
      location: schedule.location,
      job_limit: schedule.job_limit,
      day: schedule.day,
      time: schedule.time.slice(0, 5),
      email: schedule.email,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const original = schedules.find((s) => s.id === editingId);
      await updateJobSchedule(editingId, original.email, {
        keywords: formData.keywords,
        location: formData.location,
        job_limit: formData.job_limit,
        day: formData.day,
        time: formData.time,
      });

      onUpdate({ ...original, ...formData, time: formData.time + ":00" });
      setSnackbar({ open: true, message: "Schedule updated successfully!", severity: "success" });
      cancelEdit();
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to update schedule", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (schedule) => {
    setDeletingSchedule(schedule);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingSchedule) return;
    try {
      await deleteJobSchedule(deletingSchedule.id, deletingSchedule.email);
      onDelete(deletingSchedule.id);
      setSnackbar({ open: true, message: "Schedule deleted", severity: "info" });
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to delete", severity: "error" });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingSchedule(null);
    }
  };

  const isEditing = (id) => editingId === id;

  return (
    <>
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, backgroundColor: "rgba(41, 53, 72, 0.02)" }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: "#293548", width: 40, height: 40 }}>
              <CalendarIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#293548" }}>
                Scheduled Searches
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {schedules.length} active schedule{schedules.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Divider />

        {schedules.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No schedules found. Create one above to get started!
            </Typography>
          </Box>
        ) : (
          schedules.map((schedule) => (
            <Box
              key={schedule.id}
              sx={{
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                "&:last-child": { borderBottom: 0 },
              }}
            >
              {isEditing(schedule.id) ? (
                /* EDIT MODE — unchanged, perfect */
                <Box sx={{ p: { xs: 3, sm: 4 }, backgroundColor: "#fafafa" }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                      <TextField label="Keywords" value={formData.keywords || ""} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} fullWidth size={isMobile ? "small" : "medium"} InputProps={{ startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} /> }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                      <TextField label="Location" value={formData.location || ""} onChange={(e) => setFormData({ ...formData, location: e.target.value })} fullWidth size={isMobile ? "small" : "medium"} InputProps={{ startAdornment: <LocationIcon sx={{ color: "text.secondary", mr: 1 }} /> }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                      <TextField label="Email" value={formData.email || ""} disabled fullWidth size={isMobile ? "small" : "medium"} InputProps={{ startAdornment: <EmailIcon sx={{ color: "text.secondary", mr: 1 }} /> }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                      <TextField label="Job Limit" type="number" value={formData.job_limit || ""} onChange={(e) => setFormData({ ...formData, job_limit: Number(e.target.value) })} fullWidth size={isMobile ? "small" : "medium"} inputProps={{ min: 1, max: 3000 }} InputProps={{ startAdornment: <NumbersIcon sx={{ color: "text.secondary", mr: 1 }} /> }} />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography sx={{ fontWeight: 600, mb: 1, color: "#293548" }}>Select Day</Typography>
                      <ToggleButtonGroup exclusive fullWidth value={formData.day || ""} onChange={(_, v) => v && setFormData({ ...formData, day: v })} sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, "&.Mui-selected": { backgroundColor: "#293548", color: "white" } } }}>
                        {daysOfWeek.map((d) => (
                          <ToggleButton key={d} value={d}>{isMobile ? d.slice(0, 3) : d}</ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography sx={{ fontWeight: 600, mb: 1, color: "#293548" }}>Select Time</Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {timeSlots.map((t) => (
                          <Chip
                            key={t}
                            label={t}
                            clickable
                            color={formData.time === t ? "primary" : "default"}
                            onClick={() => setFormData({ ...formData, time: t })}
                            sx={{
                              backgroundColor: formData.time === t ? "#293548" : "transparent",
                              color: formData.time === t ? "white" : "#293548",
                              fontWeight: 600,
                            }}
                          />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={cancelEdit} disabled={saving}>Cancel</Button>
                        <Button variant="contained" onClick={saveEdit} disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : null} sx={{ backgroundColor: "#293548", "&:hover": { backgroundColor: "#1e2836" } }}>
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                /* VIEW MODE — FIXED FOR LARGE SCREENS */
                <Box sx={{ p: 3 }}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} md={3} lg={3}>
                      <Typography fontWeight={600} noWrap>{schedule.keywords}</Typography>
                    </Grid>
                    <Grid item xs={6} md={2} lg={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                        <Typography variant="body2" noWrap>{schedule.location}</Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6} md={1.5} lg={1.5}>
                      <Chip label={schedule.day} size="small" sx={{ fontWeight: 600 }} />
                    </Grid>
                    <Grid item xs={6} md={1.5} lg={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TimeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                        <Typography variant="body2">{schedule.time.slice(0, 5)}</Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6} md={1} lg={1}>
                      <Chip label={schedule.job_limit} color="primary" size="small" />
                    </Grid>
                    <Grid item xs={12} md={2} lg={2}>
                      <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                        {new Date(schedule.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={1} lg={1} textAlign="right">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => startEdit(schedule)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDeleteDialog(schedule)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          ))
        )}
      </Paper>

      {/* Delete Dialog & Snackbar remain unchanged */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#293548", color: "white" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            Delete Schedule?
            <IconButton onClick={() => setDeleteDialogOpen(false)} sx={{ color: "white" }}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText>
            Are you sure you want to delete this scheduled search?<br />
            <strong>{deletingSchedule?.keywords}</strong> in <strong>{deletingSchedule?.location}</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ScheduleTable;