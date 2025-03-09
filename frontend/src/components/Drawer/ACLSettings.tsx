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
  id?: number;
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
  const [newIpValue, setNewIpValue] = useState<string>("");
  const [newIpError, setNewIpError] = useState<string>("");
  const [ipErrors, setIpErrors] = useState<Record<number, string>>({});

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

  const validateIpAddress = (ip: string): boolean => {
    // IPv4 regex pattern
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 regex pattern
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^([0-9a-fA-F]{1,4}:){0,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$/;
    
    // CIDR notation support
    const ipWithCidrPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([0-9]|[1-2][0-9]|3[0-2]))$/;
    
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip) || ipWithCidrPattern.test(ip);
  };

  const handleChange = (field: keyof ACLData, value: string | boolean) => {
    const updatedData = {
      ...aclData,
      [field]: value
    };
    setAclData(updatedData);
    
    // Explicitly trigger onChange to ensure parent component knows about the change
    if (onChange) {
      onChange(updatedData);
    }
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
                    error={!!ipErrors[index]}
                    helperText={ipErrors[index] || ""}
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: 'action.hover' }}
                  />
                  <IconButton 
                    onClick={() => {
                      const newIps = aclData.ipAddresses.split(',')
                        .map(ip => ip.trim())
                        .filter(ip => ip !== '')
                        .filter((_, i) => i !== index);
                      
                      // Update errors state by removing the deleted IP's error
                      setIpErrors(prev => {
                        const updated = {...prev};
                        delete updated[index];
                        // Adjust remaining indices
                        const newErrors: Record<number, string> = {};
                        Object.entries(updated).forEach(([key, value]) => {
                          const keyNum = parseInt(key);
                          if (keyNum > index) {
                            newErrors[keyNum - 1] = value;
                          } else {
                            newErrors[keyNum] = value;
                          }
                        });
                        return newErrors;
                      });
                      
                      // Always set the IP addresses, even if the list is now empty
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
                value={newIpValue}
                onChange={(e) => setNewIpValue(e.target.value)}
                error={!!newIpError}
                helperText={newIpError || ""}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ 
                  ml: 1, 
                  alignSelf: "flex-start", 
                  minHeight: 40,
                  height: 40 
                }}
                onClick={() => {
                  const newIp = newIpValue.trim();
                  if (newIp) {
                    if (!validateIpAddress(newIp)) {
                      setNewIpError("Please enter a valid IP address");
                      return;
                    }
                    
                    setNewIpError("");
                    const currentIps = aclData.ipAddresses 
                      ? aclData.ipAddresses.split(',').map(ip => ip.trim()).filter(ip => ip !== '') 
                      : [];
                    handleChange("ipAddresses", [...currentIps, newIp].join(','));
                    setNewIpValue("");
                  }
                }}
              >
                <Add />
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              List of allowed IP addresses or subnets.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Empty list denies access from all IPs.
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
