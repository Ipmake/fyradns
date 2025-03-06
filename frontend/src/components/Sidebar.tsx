import {
  ChevronRight,
  DynamicFormOutlined,
  ExpandMore,
  Home,
  ListRounded,
  PeopleRounded,
  TableViewRounded,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  ListItemIcon,
  MenuItem,
  Typography,
} from "@mui/material";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../states/AuthState";

function Sidebar() {
  const [isConfigOpen, setIsConfigOpen] = React.useState(
    document.location.pathname.startsWith("/config/resolver")
  );

  const { pathname } = useLocation();
  const { user } = useAuthStore();

  return (
    <Box
      sx={{
        width: "250px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
        position: "fixed",
        background: (theme) => theme.palette.background.paper,
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        overflowY: "auto",
        transition: "all 0.3s ease",
        pt: 1,
        "&::-webkit-scrollbar": {
          width: "4px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: (theme) => theme.palette.grey[700],
          borderRadius: "4px",
        },
      }}
    >
      {[
        { name: "Home", path: "/", icon: Home },
        {
          name: "Zones",
          path: "/zones",
          icon: TableViewRounded,
        },
        {
          name: "Logs",
          path: "/logs",
          icon: ListRounded,
        },
        ...(user?.isAdmin
          ? [
              {
                name: "Users",
                icon: PeopleRounded,
                path: "/users",
              },
            ]
          : []),
        {
          name: "Config",
          icon: ChevronRight,
          expandIcon: ExpandMore,
          isOpen: isConfigOpen,
          onToggle: () => setIsConfigOpen(!isConfigOpen),
          subItems: [
            {
              name: "Resolver",
              icon: DynamicFormOutlined,
              path: "/config/resolver",
            },
          ],
        },
      ].map((item) =>
        item.subItems ? (
          <Box key={item.name} sx={{ mb: 0.5 }}>
            {/* Check if any child is active */}
            {(() => {
              const hasActiveChild =
                item.subItems &&
                item.subItems.some((subItem) => pathname === subItem.path);
              return (
                <MenuItem
                  onClick={item.onToggle}
                  sx={{
                    width: "90%",
                    mx: "auto",
                    py: "10px",
                    my: 0.5,
                    borderRadius: "10px",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(21, 96, 189, 0.1)",
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: "40px",
                      color: hasActiveChild ? "primary.main" : "inherit",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {item.isOpen ? <item.expandIcon /> : <item.icon />}
                  </ListItemIcon>
                  <Typography
                    sx={{
                      fontWeight: hasActiveChild ? 600 : 400,
                      color: hasActiveChild ? "primary.main" : "inherit",
                    }}
                  >
                    {item.name}
                  </Typography>
                </MenuItem>
              );
            })()}
            <Collapse in={item.isOpen} timeout={300}>
              <Box sx={{ pl: 2, pr: 1 }}>
                {item.subItems.map((subItem) => (
                  <Link
                    to={subItem.path}
                    key={subItem.path}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <MenuItem
                      sx={{
                        width: "90%",
                        mx: "auto",
                        py: "10px",
                        my: 0.5,
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                        position: "relative",
                        background:
                          pathname === subItem.path
                            ? "rgba(21, 96, 189, 0.15)"
                            : "transparent",
                        "&:hover": {
                          backgroundColor: "rgba(21, 96, 189, 0.1)",
                          transform: "translateX(4px)",
                        },
                        "&::before":
                          pathname === subItem.path
                            ? {
                                content: '""',
                                position: "absolute",
                                left: "-10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                height: "60%",
                                width: "4px",
                                backgroundColor: "primary.main",
                                borderRadius: "0 4px 4px 0",
                              }
                            : {},
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: "40px",
                          color:
                            pathname === subItem.path
                              ? "primary.main"
                              : "inherit",
                        }}
                      >
                        <subItem.icon />
                      </ListItemIcon>
                      <Typography
                        sx={{
                          fontWeight: pathname === subItem.path ? 500 : 400,
                          color:
                            pathname === subItem.path
                              ? "primary.main"
                              : "inherit",
                        }}
                      >
                        {subItem.name}
                      </Typography>
                    </MenuItem>
                  </Link>
                ))}
              </Box>
            </Collapse>
          </Box>
        ) : (
          <Link
            to={item.path}
            key={item.path}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <MenuItem
              sx={{
                width: "90%",
                mx: "auto",
                py: "10px",
                my: 0.5,
                borderRadius: "10px",
                transition: "all 0.2s ease",
                position: "relative",
                background:
                  pathname === item.path
                    ? "rgba(21, 96, 189, 0.15)"
                    : "transparent",
                "&:hover": {
                  backgroundColor: "rgba(21, 96, 189, 0.1)",
                  transform: "translateX(4px)",
                },
                "&::before":
                  pathname === item.path
                    ? {
                        content: '""',
                        position: "absolute",
                        left: "-10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: "60%",
                        width: "4px",
                        backgroundColor: "primary.main",
                        borderRadius: "0 4px 4px 0",
                      }
                    : {},
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "40px",
                  color: pathname === item.path ? "primary.main" : "inherit",
                }}
              >
                <item.icon />
              </ListItemIcon>
              <Typography
                sx={{
                  fontWeight: pathname === item.path ? 500 : 400,
                  color: pathname === item.path ? "primary.main" : "inherit",
                }}
              >
                {item.name}
              </Typography>
            </MenuItem>
          </Link>
        )
      )}
    </Box>
  );
}

export default Sidebar;
