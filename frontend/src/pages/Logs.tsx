import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  CircularProgress,
  Chip,
  Toolbar,
  Button,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import moment from "moment";
import axios from "axios";
import getBackendURL from "../util/getBackend";

// Log level colors
const logLevelColors: Record<string, string> = {
  NOERROR: "success",
  FORMERR: "warning",
  SERVFAIL: "error",
  NXDOMAIN: "warning",
  NOTIMP: "warning",
  REFUSED: "error",
  YXDOMAIN: "warning",
  XRRSET: "warning",
  NOTAUTH: "error",
  NOTZONE: "error",
};

interface DnsLogEntry {
  timestamp: string;
  level: number;
  query?: {
    name?: string;
    type?: string;
    class?: string;
  };
  response?: {
    code?: string;
  };
  client?: {
    ip?: string;
    port?: number;
  };
}

const logLevelStrings = [
  "NOERROR",
  "FORMERR",
  "SERVFAIL",
  "NXDOMAIN",
  "NOTIMP",
  "REFUSED",
  "YXDOMAIN",
  "YXRRSET",
  "NXRRSET",
  "NOTAUTH",
  "NOTZONE",
];

const LogsPage: React.FC = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState<DnsLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lineCount, setLineCount] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${getBackendURL()}/api/logs?lines=${lineCount}`,
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );
      setLogs(response.data.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError("Failed to fetch logs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [lineCount]);

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleLineCountChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLineCount(parseInt(event.target.value));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Toolbar
        sx={{
          px: { xs: 2, md: 2 },
          py: 2,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: 600, color: theme.palette.text.primary }}
        >
          DNS Logs
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            label="Lines"
            value={lineCount}
            onChange={handleLineCountChange}
            variant="outlined"
            size="small"
            sx={{
              width: 100,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
              },
            }}
          >
            {[50, 100, 200, 500, 1000].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            disableElevation
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              px: 2,
              backgroundColor: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Toolbar>

      {error && (
        <Box
          sx={{
            p: 2,
            color: theme.palette.error.main,
            borderLeft: `4px solid ${theme.palette.error.main}`,
          }}
        >
          <Typography>{error}</Typography>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: "hidden", height: "100%" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={40} thickness={4} />
          </Box>
        ) : (
          <TableContainer sx={{ height: "100%", overflow: "auto" }}>
            <Table stickyHeader sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Query</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: 100,
                        }}
                      >
                        <Typography
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          No logs found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, index) => {
                    const logLevel = logLevelStrings[log.level];
                    const chipColor = logLevelColors[logLevel] as
                      | "default"
                      | "primary"
                      | "secondary"
                      | "error"
                      | "info"
                      | "success"
                      | "warning";

                    return (
                      <TableRow
                        key={index}
                        hover
                        sx={{
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.action.hover,
                              0.1
                            ),
                          },
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {moment(new Date(log.timestamp)).format(
                            "yyyy-MM-DD HH:mm:ss"
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={logLevel}
                            color={chipColor || "default"}
                            size="small"
                            sx={{
                              borderRadius: "6px",
                              fontWeight: 500,
                              fontSize: "0.75rem",
                              py: 0.5,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {log.query?.name || "-"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {log.query?.type || "-"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {log.client?.ip
                            ? `${log.client.ip}:${log.client.port}`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default LogsPage;
