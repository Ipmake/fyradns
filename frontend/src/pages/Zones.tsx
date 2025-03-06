import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { DataGrid, GridInputRowSelectionModel } from "@mui/x-data-grid";
import axios from "axios";
import { useEffect, useState } from "react";
import getBackendURL from "../util/getBackend";
import { useZoneDrawer } from "../components/Drawer/Zone";
import { Link } from "react-router-dom";

function Zones() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Types.Zone[]>([]);
  const [selected, setSelected] = useState<
    GridInputRowSelectionModel | undefined
  >(undefined);

  const fetchData = () => {
    axios
      .get(`${getBackendURL()}/api/zones`, {
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
          Zones
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
                    `${getBackendURL()}/api/zones/batch`,
                    {
                      delete: selectedItems,
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
              useZoneDrawer.getState().setTarget("new", () => {
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
        rows={data.map((zone) => ({
          id: zone.domain,
          ...zone,
        }))}
        pageSizeOptions={[100]}
        disableRowSelectionOnClick
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
            field: "domain",
            headerName: "Domain",
            flex: 1,
            editable: false,
            resizable: false,
            renderCell: (params) => (
              <Link
                to={`/records/${params.value}`}
                style={{
                  color: "inherit",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                {params.value}
              </Link>
            ),
          },
          {
            field: "description",
            headerName: "Description",
            flex: 1,
            maxWidth: 800,
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
            field: "actions",
            type: "actions",
            headerName: "",
            headerAlign: "right",
            width: 110,
            align: "right",
            editable: false,
            resizable: false,
            renderCell: (row) => {
              return (
                <Box
                  sx={{ display: "flex", alignItems: "center", height: "100%" }}
                >
                  <Button
                    variant="text"
                    onClick={() => {
                      useZoneDrawer
                        .getState()
                        .setTarget(row.row.domain as string, () => {
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

export default Zones;
