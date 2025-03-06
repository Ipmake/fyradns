import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { DataGrid, GridInputRowSelectionModel } from "@mui/x-data-grid";
import axios from "axios";
import { useEffect, useState } from "react";
import getBackendURL from "../util/getBackend";
import { useUserDrawer } from "../components/Drawer/User";
import useAuthStore from "../states/AuthState";

function Users() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Types.BaseUser[]>([]);
  const [selected, setSelected] = useState<
    GridInputRowSelectionModel | undefined
  >(undefined);
  const [tokenPopup, setTokenPopup] = useState<Types.BaseUser | false>(false);

  const { user } = useAuthStore();

  const fetchData = () => {
    axios
      .get(`${getBackendURL()}/api/users`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((res) => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {tokenPopup && (
        <TokenPopup data={tokenPopup} onClose={() => setTokenPopup(false)} />
      )}
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
          sx={{ fontWeight: 600, color: (theme) => theme.palette.text.primary }}
        >
          Users
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Collapse
            orientation="horizontal"
            in={Boolean(selected && (selected as unknown as string[])?.length)}
          >
            <Button
              variant="contained"
              onClick={() => {
                const selectedItems = selected as string[];
                if (!selectedItems || selectedItems.length === 0) return;

                axios
                  .post(
                    `${getBackendURL()}/api/users/batch`,
                    {
                      delete: selectedItems.map((id) => parseInt(id)),
                    },
                    {
                      headers: {
                        Authorization: localStorage.getItem("token"),
                      },
                    }
                  )
                  .then(() => {
                    fetchData();
                  });
              }}
              color="error"
            >
              Delete
            </Button>
          </Collapse>

          <Button
            variant="contained"
            onClick={() => {
              useUserDrawer.getState().setTarget("new", () => {
                fetchData();
              });
            }}
          >
            New
          </Button>
        </Stack>
      </Toolbar>

      <DataGrid
        checkboxSelection
        rows={data}
        pageSizeOptions={[100]}
        disableRowSelectionOnClick
        isRowSelectable={(params) => !(params.row.id === user?.id || params.row.username === "admin")}
        rowSelectionModel={selected}
        onRowSelectionModelChange={(newSelection) => {
          setSelected(newSelection);
        }}
        sx={{
          border: "none",
        }}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 100,
            },
          },
        }}
        columns={[
          {
            field: "name",
            headerName: "Name",
            flex: 1,
            editable: false,
            resizable: false,
          },
          {
            field: "username",
            headerName: "Username",
            flex: 1,
            editable: false,
            resizable: false,
          },
          {
            field: "email",
            headerName: "Email",
            flex: 1,
            editable: false,
            resizable: false,
          },
          {
            field: "enabled",
            headerName: "Enabled",
            width: 100,
            editable: false,
            resizable: false,
            renderCell: (params) => (
              <Box
                sx={{ display: "flex", alignItems: "center", height: "100%" }}
              >
                <Chip
                  label={params.value ? "Enabled" : "Disabled"}
                  size="small"
                  color={params.value ? "success" : "default"}
                  variant="outlined"
                  sx={{ minWidth: 70, fontSize: "0.75rem" }}
                />
              </Box>
            ),
          },
          {
            field: "isApi",
            headerName: "API User",
            width: 100,
            editable: false,
            resizable: false,
            renderCell: (params) => (
              <Box
                sx={{ display: "flex", alignItems: "center", height: "100%" }}
              >
                <Chip
                  label={params.value ? "API" : "Standard"}
                  size="small"
                  color={params.value ? "primary" : "default"}
                  variant="outlined"
                  sx={{ minWidth: 70, fontSize: "0.75rem" }}
                />
              </Box>
            ),
          },
          {
            field: "isAdmin",
            headerName: "Admin",
            width: 100,
            editable: false,
            resizable: false,
            renderCell: (params) => (
              <Box
                sx={{ display: "flex", alignItems: "center", height: "100%" }}
              >
                <Chip
                  label={params.value ? "Admin" : "User"}
                  size="small"
                  color={params.value ? "warning" : "default"}
                  variant="outlined"
                  sx={{ minWidth: 70, fontSize: "0.75rem" }}
                />
              </Box>
            ),
          },
          {
            field: "actions",
            type: "actions",
            headerName: "",
            headerAlign: "right",
            width: 200,
            align: "right",
            editable: false,
            resizable: false,
            renderCell: (row) => {
              return (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "10px",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  {!row.row.isApi ? null : (
                    <Button
                      variant="text"
                      disabled={row.row.id === user?.id}
                      onClick={() => {
                        setTokenPopup(row.row);
                      }}
                    >
                      Token
                    </Button>
                  )}

                  <Button
                    variant="text"
                    onClick={() => {
                      useUserDrawer
                        .getState()
                        .setTarget(`${row.row.id}`, () => {
                          fetchData();
                        });
                    }}
                  >
                    Edit
                  </Button>
                </Box>
              );
            },
          },
        ]}
      />
    </Box>
  );
}

export default Users;

function TokenPopup({
  data,
  onClose,
}: {
  data: Types.BaseUser;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get(`${getBackendURL()}/api/users/${data.id}/token`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      })
      .then((res) => {
        setToken(res.data.token);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Dialog open onClose={onClose} maxWidth="lg">
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                p: 3,
                minWidth: 650,
                overflow: "hidden",
            }}
        >
            <Typography variant="h6" component="div">
                Token for <strong>{data.name}</strong>
            </Typography>
            
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                            variant="outlined"
                            label="Token"
                            value={token}
                            fullWidth
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                        <Button 
                            variant="contained"
                            onClick={() => {
                                navigator.clipboard.writeText(token || "");
                            }}
                        >
                            Copy
                        </Button>
                    </Box>
                    <Typography 
                        variant="body2" 
                        color="warning.main" 
                        sx={{ mt: 1 }}
                    >
                        Warning: Requesting this token again will generate a new token and invalidate this one.
                    </Typography>
                </>
            )}
        </Box>
    </Dialog>
  );
}
