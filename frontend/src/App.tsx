import { Box, CircularProgress } from "@mui/material";
import useAuthStore from "./states/AuthState";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import axios from "axios";
import getBackendURL from "./util/getBackend";
import Sidebar from "./components/Sidebar";
import { Route, Routes } from "react-router-dom";
import Appbar from "./components/Appbar";
import Zones from "./pages/Zones";
import ZoneDrawer from "./components/Drawer/Zone";
import Records from "./pages/Records";
import ResolverPage from "./pages/Config/Resolver";
import LogsPage from "./pages/Logs";
import Users from "./pages/Users";
import UserDrawer from "./components/Drawer/User";

function App() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("token")) return setLoading(false);

    axios
      .get(`${getBackendURL()}/api/auth/me`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((res) => {
        if (res.status === 200) useAuthStore.getState().setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        useAuthStore.getState().logout();
        localStorage.removeItem("token");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );

  if (!user) {
    return <Login />;
  }

  return <ManageLayout />;
}
export default App;

function ManageLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        height: "100vh",
        maxHeight: "100vh",
      }}
    >
      <ZoneDrawer />
      <UserDrawer />
      
      <Appbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          height: "100%",
          width: "100%",
        }}
      >
        <Sidebar />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "calc(100vw - 250px)",
            height: "calc(100vh - 64px)",
            ml: "250px",
          }}
        >
          <Routes>
            <Route path="/" element={<h1>Dashboard</h1>} />
            <Route path="/zones" element={<Zones />} />
            <Route path="/records/:zoneName" element={<Records />} />

            <Route path="/logs" element={<LogsPage />} />
            <Route path="/users" element={<Users />} />

            <Route path="/config/resolver" element={<ResolverPage />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}
