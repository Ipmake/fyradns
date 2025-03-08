import { ExpandMoreRounded, DeleteOutlined, Add } from "@mui/icons-material";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Stack,
  TextField,
  Switch,
  Box,
  IconButton,
  Button
} from "@mui/material";
import { useState, useEffect } from "react";

interface ACLSettingsProps {
  zoneDomain?: string;
  onChange?: (aclData: ACLData) => void;
  initialData?: ACLData | null;
}

export interface ACLData {
  zoneDomain?: string;
  ipAddresses: string;
  description?: string;
  enabled: boolean;
}

function ACLSettings({
  zoneDomain,
  onChange,
  initialData,
}: ACLSettingsProps) {
  const [aclData, setAclData] = useState<ACLData>({
    ipAddresses: "",
    description: "",
    enabled: true,
    ...initialData,
  });

  // Update ACL data when zoneDomain changes
  useEffect(() => {
    if (zoneDomain && !initialData) {
      setAclData(prevData => ({
        ...prevData,
        zoneDomain,
      }));
    }
  }, [zoneDomain, initialData]);

  // Notify parent component when data changes
  useEffect(() => {
    if (onChange) {
      onChange(aclData);
    }
  }, [aclData, onChange]);

  const handleChange = (field: keyof ACLData, value: string | boolean) => {
    setAclData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Accordion defaultExpanded={false}>
      <AccordionSummary
        expandIcon={<ExpandMoreRounded />}
        aria-controls="acl-settings-content"
        id="acl-settings-header"
      >
        <Typography>Access Control Lists</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Switch
              checked={aclData.enabled}
              onChange={(e) => handleChange("enabled", e.target.checked)}
            />
            <Typography>ACL Enabled</Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>IP Addresses</Typography>
            {aclData.ipAddresses.split(',')
              .map(ip => ip.trim())
              .filter(ip => ip !== '')
              .map((ip, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TextField 
                size="small"
                value={ip}
                fullWidth
                onChange={(e) => {
                  const newIps = aclData.ipAddresses.split(',')
                .map(ip => ip.trim())
                .filter(ip => ip !== '');
                  newIps[index] = e.target.value;
                  handleChange("ipAddresses", newIps.join(','));
                }}
              />
              <IconButton 
                onClick={() => {
                  const newIps = aclData.ipAddresses.split(',')
                .map(ip => ip.trim())
                .filter(ip => ip !== '')
                .filter((_, i) => i !== index);
                  handleChange("ipAddresses", newIps.join(','));
                }}
              >
                <DeleteOutlined />
              </IconButton>
            </Box>
              ))}
            
            <Box sx={{ display: 'flex', mt: 1 }}>
              <TextField
                size="small"
                placeholder="Add new IP address"
                fullWidth
                id="new-ip-address"
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ ml: 1 }}
                onClick={() => {
                  const newIp = (document.getElementById('new-ip-address') as HTMLInputElement).value;
                  if (newIp.trim()) {
                    const currentIps = aclData.ipAddresses ? aclData.ipAddresses.split(',').map(ip => ip.trim()).filter(ip => ip !== '') : [];
                    handleChange("ipAddresses", [...currentIps, newIp.trim()].join(','));
                    (document.getElementById('new-ip-address') as HTMLInputElement).value = '';
                  }
                }}
              >
                <Add />
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              List of allowed IP addresses or subnets
            </Typography>
          </Box>
          
          <TextField
            label="Description"
            placeholder="Allowed servers"
            helperText="Optional description for this ACL"
            value={aclData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default ACLSettings;
