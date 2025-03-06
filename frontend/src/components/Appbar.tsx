import { AppBar, Avatar, Box, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { AccountCircle, Settings } from "@mui/icons-material";
import useAuthStore from "../states/AuthState";
import { useState } from "react";

function Appbar() {
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
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
    // Implement password change functionality
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
                boxShadow: "0 0 8px rgba(255,255,255,0.4)"
              }
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
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.2))',
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
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
