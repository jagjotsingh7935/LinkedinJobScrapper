import React, { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Stack,
  Divider,
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
  DeleteOutline as DeleteIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Numbers as NumbersIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
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
      time: schedule.time ? schedule.time.slice(0, 5) : "09:00",
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
      setSnackbar({ open: true, message: "Schedule removed successfully", severity: "info" });
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to delete schedule", severity: "error" });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingSchedule(null);
    }
  };

  const isEditing = (id) => editingId === id;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3.5,
          overflow: "hidden",
          mb: 4,
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
        }}
      >
        <Box sx={{ p: { xs: 2.5, sm: 3 }, backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ bgcolor: "#eff6ff", color: "#2563eb", width: 40, height: 40 }}>
                <CalendarIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem" }}>
                  Active Scraping Schedules
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {schedules.length} recurring automated job{schedules.length !== 1 ? "s" : ""} configured
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>

        {schedules.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No active schedules configured yet. Use the form above to schedule recurring scraper tasks.
            </Typography>
          </Box>
        ) : (
          schedules.map((schedule) => (
            <Box
              key={schedule.id}
              sx={{
                borderBottom: "1px solid #f1f5f9",
                "&:last-child": { borderBottom: 0 },
                transition: "background-color 0.2s",
                "&:hover": {
                  backgroundColor: !isEditing(schedule.id) ? "#f8fafc" : "inherit",
                },
              }}
            >
              {isEditing(schedule.id) ? (
                /* EDIT MODE */
                <Box sx={{ p: { xs: 2.5, sm: 3.5 }, backgroundColor: "#f8fafc" }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <TextField
                      label="Keywords"
                      value={formData.keywords || ""}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      fullWidth
                      size="small"
                      InputProps={{ startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 18 }} /> }}
                    />
                    <TextField
                      label="Location"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      fullWidth
                      size="small"
                      InputProps={{ startAdornment: <LocationIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 18 }} /> }}
                    />
                    <TextField
                      label="Email"
                      value={formData.email || ""}
                      disabled
                      fullWidth
                      size="small"
                      InputProps={{ startAdornment: <EmailIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 18 }} /> }}
                    />
                    <TextField
                      label="Job Limit"
                      type="number"
                      value={formData.job_limit || ""}
                      onChange={(e) => setFormData({ ...formData, job_limit: Number(e.target.value) })}
                      fullWidth
                      size="small"
                      inputProps={{ min: 1, max: 200 }}
                      InputProps={{ startAdornment: <NumbersIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 18 }} /> }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 600, mb: 1, color: "#1e293b", fontSize: "0.85rem" }}>
                      Execution Day
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      value={formData.day || ""}
                      onChange={(_, v) => v && setFormData({ ...formData, day: v })}
                      sx={{
                        gap: 0.5,
                        "& .MuiToggleButton-root": {
                          borderRadius: "8px !important",
                          border: "1px solid #e2e8f0 !important",
                          textTransform: "none",
                          fontWeight: 600,
                          py: 0.75,
                          "&.Mui-selected": {
                            backgroundColor: "#2563eb !important",
                            color: "white !important",
                          },
                        },
                      }}
                    >
                      {daysOfWeek.map((d) => (
                        <ToggleButton key={d} value={d}>
                          {isMobile ? d.slice(0, 3) : d}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 600, mb: 1, color: "#1e293b", fontSize: "0.85rem" }}>
                      Execution Time (24h)
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {timeSlots.map((t) => (
                        <Chip
                          key={t}
                          label={t}
                          clickable
                          onClick={() => setFormData({ ...formData, time: t })}
                          sx={{
                            backgroundColor: formData.time === t ? "#2563eb" : "#ffffff",
                            color: formData.time === t ? "#ffffff" : "#475569",
                            border: "1px solid",
                            borderColor: formData.time === t ? "#2563eb" : "#cbd5e1",
                            fontWeight: 600,
                            height: 30,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 1 }}>
                      <Button onClick={cancelEdit} disabled={saving} sx={{ textTransform: "none", fontWeight: 600 }}>
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={saveEdit}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <CheckIcon fontSize="small" />}
                        sx={{
                          backgroundColor: "#2563eb",
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": { backgroundColor: "#1d4ed8" },
                        }}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              ) : (
                /* VIEW MODE */
                <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1.5fr 1fr 100px",
                        md: "1.8fr 1.4fr 110px 100px 90px 90px",
                      },
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }} noWrap>
                        {schedule.keywords}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {schedule.email}
                      </Typography>
                    </Box>

                    <Box>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <LocationIcon sx={{ fontSize: 16, color: "#64748b" }} />
                        <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }} noWrap>
                          {schedule.location}
                        </Typography>
                      </Stack>
                    </Box>

                    <Box>
                      <Chip
                        label={schedule.day}
                        size="small"
                        sx={{
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          fontWeight: 600,
                          border: "1px solid #bfdbfe",
                        }}
                      />
                    </Box>

                    <Box>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <TimeIcon sx={{ fontSize: 16, color: "#64748b" }} />
                        <Typography variant="body2" sx={{ color: "#475569", fontWeight: 600 }}>
                          {schedule.time ? schedule.time.slice(0, 5) : "--:--"}
                        </Typography>
                      </Stack>
                    </Box>

                    <Box>
                      <Chip
                        label={`${schedule.job_limit} jobs`}
                        size="small"
                        sx={{
                          backgroundColor: "#f1f5f9",
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                      <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                        <Tooltip title="Edit schedule">
                          <IconButton
                            size="small"
                            onClick={() => startEdit(schedule)}
                            sx={{
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              color: "#475569",
                              "&:hover": { backgroundColor: "#eff6ff", color: "#2563eb" },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete schedule">
                          <IconButton
                            size="small"
                            onClick={() => openDeleteDialog(schedule)}
                            sx={{
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              color: "#94a3b8",
                              "&:hover": { backgroundColor: "#fef2f2", color: "#ef4444", borderColor: "#fecaca" },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          ))
        )}
      </Paper>

      {/* Modern Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: { borderRadius: 3.5, p: 1 },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 3, fontWeight: 700, color: "#0f172a" }}>
          Delete Schedule?
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", px: 3 }}>
          <DialogContentText sx={{ color: "#64748b" }}>
            Are you sure you want to delete the automated search for{" "}
            <strong style={{ color: "#0f172a" }}>"{deletingSchedule?.keywords}"</strong> in{" "}
            <strong style={{ color: "#0f172a" }}>{deletingSchedule?.location}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, justifyContent: "center", gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ fontWeight: 600, color: "#64748b", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            sx={{
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              px: 3,
            }}
          >
            Delete Schedule
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: 2.5, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ScheduleTable;