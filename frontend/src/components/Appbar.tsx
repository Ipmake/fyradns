import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AccountCircle,
  LockReset,
  Settings,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import useAuthStore from "../states/AuthState";
import { useState } from "react";
import axios, { AxiosError } from "axios";
import getBackendURL from "../util/getBackend";
import { SHA256 } from "crypto-js";

function Appbar() {
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
    handleCloseMenu();
  };

  const handleChangePassword = () => {
    setChangePasswordOpen(true);
    handleCloseMenu();
  };

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        height: "64px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        backdropFilter: "blur(10px)",
        borderRadius: 0,
      }}
    >
      {changePasswordOpen && (
        <ChangePasswordDialog
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
        />
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <img src="/logo.png" alt="logo" style={{ height: "36px" }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            letterSpacing: "0.5px",
            fontSize: "20px",
            background: "linear-gradient(90deg, #ffffff, #e3f2fd)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          FyraDNS
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip title="Account settings">
          <Avatar
            sx={{
              cursor: "pointer",
              bgcolor: "#303030",
              color: "#ffffff",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 0 8px rgba(255,255,255,0.4)",
              },
            }}
            onClick={handleOpenMenu}
          >
            {(user?.username as string | undefined)?.slice(0, 1).toUpperCase()}
          </Avatar>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: "200px",
              mt: 1.5,
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.2))",
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem sx={{ py: 1 }}>
            <Avatar sx={{ bgcolor: "#1976d2" }} /> {user?.username}
          </MenuItem>
          <MenuItem onClick={handleChangePassword}>
            <Settings fontSize="small" sx={{ mr: 1.5 }} /> Change Password
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <AccountCircle fontSize="small" sx={{ mr: 1.5 }} /> Logout
          </MenuItem>
        </Menu>
      </Box>
    </AppBar>
  );
}

export default Appbar;

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const { user } = useAuthStore();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${getBackendURL()}/api/auth/change-password`,
        {
          password: SHA256(`fyraDNS${password}fyraDNS`).toString(),
          confirmPassword: SHA256(
            `fyraDNS${confirmPassword}fyraDNS`
          ).toString(),
        },
        {
          headers: {
            Authorization: user?.token,
          },
        }
      );

      if (response.data.success) {
        setPassword("");
        setConfirmPassword("");
        onClose();
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setConfirmPassword("");
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        elevation: 2,
        sx: {
          borderRadius: 2,
          width: "400px",
          maxWidth: "95vw",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <LockReset color="primary" />
          <Typography variant="h6">Change Password</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Collapse in={error !== ""}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Collapse>

        <TextField
          autoFocus
          margin="dense"
          label="New Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          variant="outlined"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            !password ||
            !confirmPassword ||
            loading ||
            password !== confirmPassword
          }
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {loading ? "Saving" : "Save Password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
