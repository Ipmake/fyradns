import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Switch,
  Backdrop,
  Divider,
  Collapse,
} from "@mui/material";
import { useEffect, useState } from "react";
import { create } from "zustand";
import ButtonWithLoad from "../ButtonWithLoad";
import axios from "axios";
import getBackendURL from "../../util/getBackend";
import { SHA256 } from "crypto-js";

interface UserDrawerState {
  target: string | null;
  callback?: () => void;
  setTarget: (target: string | null, callback?: () => void) => void;
}

export const useUserDrawer = create<UserDrawerState>((set) => ({
  target: null,
  setTarget: (target, callback) => {
    set({ target, callback });
  },
}));

function UserDrawer() {
  const { target, setTarget, callback } = useUserDrawer();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const [data, setData] = useState<Partial<Types.UIUserCreate> | null>(null);

  useEffect(() => {
    setData(null);
    setSaveLoading(false);
    setLoading(true);
    setChangePassword(target === "new");
    if (!target) return;

    if (target === "new") {
      setData({
        username: "",
        email: "",
        name: "",
        isApi: false,
        isAdmin: false,
        enabled: true,
      });
      setLoading(false);
      return;
    } else {
      axios
        .get(`${getBackendURL()}/api/users/${target}`, {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        })
        .then((res) => {
          setData({
            ...res.data.data,
          });
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
          User
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
          label="Username"
          disabled={target !== "new"}
          value={data?.username || ""}
          onChange={(e) =>
            data && setData({ ...data, username: e.target.value })
          }
          fullWidth
        />

        <TextField
          label="Name"
          value={data?.name || ""}
          placeholder="John Doe"
          onChange={(e) => data && setData({ ...data, name: e.target.value })}
          fullWidth
        />

        <TextField
          label="Email"
          value={data?.email || ""}
          onChange={(e) => data && setData({ ...data, email: e.target.value })}
          fullWidth
        />

        <Stack direction="row" alignItems="center">
          <Switch
            checked={data?.isApi || false}
            disabled={target !== "new"}
            onChange={() => data && setData({ ...data, isApi: !data.isApi })}
          />
          <Typography>API User</Typography>
        </Stack>

        <Stack direction="row" alignItems="center">
          <Switch
            checked={data?.isAdmin || false}
            onChange={() =>
              data && setData({ ...data, isAdmin: !data.isAdmin })
            }
          />
          <Typography>Admin</Typography>
        </Stack>

        <Divider />
        <Collapse in={!data?.isApi}>
          <Stack direction="column" gap={2}>
            <Stack direction="row" alignItems="center">
              <Switch
                checked={changePassword}
                disabled={target === "new"}
                onChange={() => data && setChangePassword(!changePassword)}
              />
              <Typography>Change Password</Typography>
            </Stack>

            <Collapse in={changePassword}>
              <Stack direction="column" alignItems="center" gap={2}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={data?.password || ""}
                  onChange={(e) =>
                    data && setData({ ...data, password: e.target.value })
                  }
                />

                <TextField
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  value={data?.confirmPassword || ""}
                  onChange={(e) =>
                    data &&
                    setData({ ...data, confirmPassword: e.target.value })
                  }
                />
              </Stack>
            </Collapse>
          </Stack>
        </Collapse>

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
            disabled={
              !data ||
              !data.username ||
              !data.name ||
              // Only validate passwords for non-API users when changing password
              (!data.isApi &&
                changePassword &&
                (!data.password || data.password !== data.confirmPassword)) ||
              saveLoading
            }
            buttonText="Save"
            onClick={() => {
              if (!data) return;
              setSaveLoading(true);

              switch (target) {
                case "new":
                  {
                    axios
                      .post(
                        `${getBackendURL()}/api/users`,
                        {
                          username: data.username,
                          name: data.name,
                          email: data.email || undefined,
                          isApi: target === "new" ? data.isApi : undefined,
                          isAdmin: data.isAdmin,
                          enabled: data.enabled,
                          password:
                            changePassword && !data.isApi
                              ? SHA256(
                                  `fyraDNS${data.password}fyraDNS`
                                ).toString()
                              : undefined,
                          confirmPassword:
                            changePassword && !data.isApi
                              ? SHA256(
                                  `fyraDNS${data.password}fyraDNS`
                                ).toString()
                              : undefined,
                        } as Partial<Types.BaseUser>,
                        {
                          headers: {
                            Authorization: localStorage.getItem("token"),
                          },
                        }
                      )
                      .then(() => {
                        setSaveLoading(false);
                        setTarget(null);
                        if (callback) callback();
                      })
                      .catch(() => {
                        setSaveLoading(false);
                      });
                  }
                  break;
                default:
                  {
                    axios
                      .put(
                        `${getBackendURL()}/api/users/${target}`,
                        {
                          name: data.name,
                          email: data.email || undefined,
                          isAdmin: data.isAdmin,
                          enabled: data.enabled,
                          password:
                            changePassword && !data.isApi
                              ? SHA256(
                                  `fyraDNS${data.password}fyraDNS`
                                ).toString()
                              : undefined,
                          confirmPassword:
                            changePassword && !data.isApi
                              ? SHA256(
                                  `fyraDNS${data.password}fyraDNS`
                                ).toString()
                              : undefined,
                        } as Partial<Types.BaseUser>,
                        {
                          headers: {
                            Authorization: localStorage.getItem("token"),
                          },
                        }
                      )
                      .then(() => {
                        setSaveLoading(false);
                        setTarget(null);
                        if (callback) callback();
                      })
                      .catch(() => {
                        setSaveLoading(false);
                      });
                  }
                  break;
              }
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

export default UserDrawer;
