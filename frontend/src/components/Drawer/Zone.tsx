import { ExpandMoreRounded } from "@mui/icons-material";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Switch,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Backdrop,
} from "@mui/material";
import { useEffect, useState } from "react";
import { create } from "zustand";
import ButtonWithLoad from "../ButtonWithLoad";
import axios from "axios";
import getBackendURL from "../../util/getBackend";

interface ZoneDrawerState {
  target: string | null;
  callback?: () => void;
  setTarget: (target: string | null, callback?: () => void) => void;
}

export const useZoneDrawer = create<ZoneDrawerState>((set) => ({
  target: null,
  setTarget: (target, callback) => {
    set({ target, callback });
  },
}));

function ZoneDrawer() {
  const { target, setTarget, callback } = useZoneDrawer();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const [data, setData] = useState<Types.Zone | null>(null);

  useEffect(() => {
    setData(null);
    setSaveLoading(false);
    setLoading(true);
    if (!target) return;

    if (target === "new") {
      setData({
        domain: "",
        description: "",
        ttl: 3600,
        refresh: 86400,
        retry: 7200,
        expire: 3600000,
        minimum: 172800,
        serial: Math.floor(Math.random() * 1000000),
        enabled: true,
      });
      setLoading(false);
      return;
    } else {
      axios
        .get(`${getBackendURL()}/api/zones/${target}`, {
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
    }
  }, [target]);

  if (target && loading)
    return (
      <Backdrop
        open={true}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      />
    );

  return (
    <Drawer
      anchor="right"
      open={Boolean(target)}
      keepMounted
      sx={{
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          width: 400,
          padding: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: "bold",
          }}
        >
          Zone
        </Typography>

        <Stack direction="row" alignItems="center">
          <Switch
            checked={data?.enabled || false}
            onChange={() =>
              data && setData({ ...data, enabled: !data.enabled })
            }
          />
          <Typography>Enabled</Typography>
        </Stack>

        <TextField
          label="Domain"
          disabled={target !== "new"}
          placeholder="example.com"
          value={data?.domain || ""}
          onChange={(e) => data && setData({ ...data, domain: e.target.value })}
          fullWidth
        />

        <TextField
          label="Description"
          helperText="Optional"
          value={data?.description || ""}
          onChange={(e) =>
            data && setData({ ...data, description: e.target.value })
          }
          fullWidth
        />

        <Accordion defaultExpanded={false}>
          <AccordionSummary
            expandIcon={<ExpandMoreRounded />}
            aria-controls="advanced-settings-content"
            id="advanced-settings-header"
          >
            <Typography>Advanced Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <TextField
                label="TTL"
                type="number"
                value={data?.ttl || 3600}
                onChange={(e) =>
                  data && setData({ ...data, ttl: Number(e.target.value) })
                }
                fullWidth
              />
              <TextField
                label="Refresh"
                type="number"
                value={data?.refresh || 86400}
                onChange={(e) =>
                  data && setData({ ...data, refresh: Number(e.target.value) })
                }
                fullWidth
              />
              <TextField
                label="Retry"
                type="number"
                value={data?.retry || 7200}
                onChange={(e) =>
                  data && setData({ ...data, retry: Number(e.target.value) })
                }
                fullWidth
              />
              <TextField
                label="Expire"
                type="number"
                value={data?.expire || 3600000}
                onChange={(e) =>
                  data && setData({ ...data, expire: Number(e.target.value) })
                }
                fullWidth
              />
              <TextField
                label="Minimum"
                type="number"
                value={data?.minimum || 172800}
                onChange={(e) =>
                  data && setData({ ...data, minimum: Number(e.target.value) })
                }
                fullWidth
              />
              <TextField
                label="Serial"
                type="number"
                value={data?.serial || 0}
                onChange={(e) =>
                  data && setData({ ...data, serial: Number(e.target.value) })
                }
                fullWidth
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <ButtonWithLoad
            variant="contained"
            loading={saveLoading}
            disabled={!data || !data.domain}
            buttonText="Save"
            onClick={() => {
              if (!data || !data.domain) return;
              setSaveLoading(true);

              axios
                .post(`${getBackendURL()}/api/zones`, data, {
                  headers: {
                    Authorization: localStorage.getItem("token"),
                  },
                })
                .then(() => {
                  setSaveLoading(false);
                  setTarget(null);
                  if (callback) callback();
                })
                .catch(() => {
                  setSaveLoading(false);
                });
            }}
          />

          <Button
            variant="contained"
            onClick={() => {
              setTarget(null);
              if (callback) callback();
            }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

export default ZoneDrawer;
