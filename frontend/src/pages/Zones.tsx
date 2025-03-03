import { Box, Button, CircularProgress, Collapse } from "@mui/material";
import { DataGrid, GridInputRowSelectionModel } from "@mui/x-data-grid";
import axios from "axios";
import { useEffect, useState } from "react";
import getBackendURL from "../util/getBackend";
import { useZoneDrawer } from "../components/Drawer/Zone";

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
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
        }}
      >
        <h1>Zones</h1>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
            alignItems: "center",
            marginRight: "20px",
          }}
        >
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
        </Box>
      </Box>

      <DataGrid
        checkboxSelection
        rows={data.map((zone) => ({
            id: zone.domain,
            ...zone
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
                  <Button variant="text" onClick={() => {
                    useZoneDrawer.getState().setTarget(row.row.domain as string, () => {
                      fetchData();
                    });
                  }}>
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
