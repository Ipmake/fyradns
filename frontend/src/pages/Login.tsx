import {
  Alert,
  Box,
  Collapse,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import ButtonWithLoad from "../components/ButtonWithLoad";
import axios from "axios";
import getBackendURL from "../util/getBackend";
import { SHA256 } from "crypto-js";

function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    setError(null);
  }, [username, password]);

  const handleLogin = () => {
    if (!username || !password) return;

    setLoading(true);

    axios.post(`${getBackendURL()}/api/auth/login`, {
        username,
        password: SHA256(`fyraDNS${password}fyraDNS`).toString()
    }).then(res => {
        if(res.status === 200) {
            localStorage.setItem('token', res.data.token);
            window.location.reload();
        }
    }).catch(err => {
        if(err.response) {
            setError(err.response.data.error);
        } else {
            setError('An error occurred');
        }
        setLoading(false);
    })
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Box
        sx={{
          width: "1000px",
          height: "375px",
          background: (theme) => theme.palette.background.paper,
          borderRadius: "10px",
          boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.75)",

          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          userSelect: "none",
        }}
      >
        <Box
          sx={{
            width: "50%",
            height: "100%",
            background:
              "linear-gradient(45deg, rgba(21, 96, 189, 0.4) 30%, rgba(0, 158, 197, 0.25) 90%), url(/starBG.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "10px 0px 0px 10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "0 2rem",
            textAlign: "center",
          }}
        >
          <img src="/logo.png" alt="logo" style={{ width: "35%" }} />
          <Typography
            variant="h5"
            sx={{
              color: "#fff",
              fontWeight: "bold",
              mt: "1rem",
            }}
          >
            FyraDNS
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#fff",
              opacity: 0.9,
              maxWidth: "60%",
              fontSize: "0.9rem",
            }}
          >
            Simple and reliable DNS management.
          </Typography>
        </Box>
        <Divider orientation="vertical" variant="middle" flexItem />
        <Box
          sx={{
            width: "50%",
            height: "100%",

            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontSize: "2rem",
              fontWeight: "bold",
            }}
          >
            Login
          </Typography>
          <Collapse in={Boolean(error)} sx={{
                width: '70%',
          }}>
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          </Collapse>

          <TextField
            sx={{ width: "70%", marginTop: "1rem" }}
            label="Username"
            variant="outlined"
            datatype="text"
            type="text"
            value={username}
            disabled={loading}
            onChange={(e) => setUsername(e.target.value)}
          />

          <TextField
            sx={{ width: "70%", marginTop: "1rem" }}
            label="Password"
            variant="outlined"
            datatype="password"
            type="password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />

          <ButtonWithLoad
            loading={loading}
            onClick={handleLogin}
            buttonText="Login"
            loadingText="Logging in..."
            disabled={!username || !password || loading}
            sx={{
              width: "70%",
              marginTop: "1rem"
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default Login;
