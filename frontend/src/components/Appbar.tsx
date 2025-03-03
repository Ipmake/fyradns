import { AppBar, Avatar, Typography } from "@mui/material";
import useAuthStore from "../states/AuthState";

function Appbar() {
  const { user, logout } = useAuthStore();

  return (
    <AppBar
      position="static"
      sx={{
        height: "64px",

        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: "20px",
        borderRadius: 0,
      }}
    >
      <img src="/logo.png" alt="logo" style={{ height: "90%" }} />
      <Typography
        sx={{
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: "24px",
        }}
      >
        FyraDNS
      </Typography>

      <Avatar
        sx={{ backgroundColor: "#303030", color: "#ffffff", ml: "auto" }}
        onClick={() => {
          logout();
          window.location.reload();
        }}
      >
        {(user?.username as string | undefined)?.slice(0, 1).toUpperCase()}
      </Avatar>
    </AppBar>
  );
}

export default Appbar;
