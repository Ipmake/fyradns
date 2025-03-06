import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Switch, TextField, Button, Grid, Box, CircularProgress, Snackbar, Alert, Fade } from '@mui/material';
import axios from 'axios';
import getBackendURL from '../../util/getBackend';
import { validateAContent } from '../../util/inputValidate';

interface Config {
    key: string;
    value: string;
}

interface ConfigState {
    useForwarder: boolean;
    forwarderServer1: string;
    forwarderServer2: string;
    loading: {
        [key: string]: boolean;
    };
}

const ResolverPage: React.FC = () => {
    const [config, setConfig] = useState<ConfigState>({
        useForwarder: false,
        forwarderServer1: '',
        forwarderServer2: '',
        loading: {}
    });
    const [originalServers, setOriginalServers] = useState<{server1: string, server2: string}>({
        server1: '',
        server2: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${getBackendURL()}/api/config`, {
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            });

            const configItems: Config[] = response.data.data;
            
            // Set initial state from API response
            const useForwarder = configItems.find(item => item.key === 'useForwarder')?.value === 'true';
            
            const forwarderServers = configItems.find(item => item.key === 'forwarderServers')?.value || '';
            const [server1 = '', server2 = ''] = forwarderServers.split(',');
            
            setConfig({
                useForwarder,
                forwarderServer1: server1,
                forwarderServer2: server2,
                loading: {}
            });
            
            // Store original values
            setOriginalServers({
                server1,
                server2
            });
        } catch (err) {
            setError('Failed to load configuration');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateConfig = async (key: string, value: string) => {
        try {
            setConfig(prev => ({
                ...prev,
                loading: { ...prev.loading, [key]: true }
            }));

            const response = await axios.put(`${getBackendURL()}/api/config/${key}`, {
                value
            },{
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            }).catch(() => {
                throw new Error(`Failed to update ${key}`);
            })
            
            if (response.status !== 200) {
                throw new Error(`Failed to update ${key}`);
            }

            // Update was successful
            if (key === 'forwarderServers') {
                const [server1 = '', server2 = ''] = value.split(',');
                setOriginalServers({ server1, server2 });
            }
            return true;
        } catch (err) {
            setError(`Failed to update ${key}`);
            console.error(err);
            return false;
        } finally {
            setConfig(prev => ({
                ...prev,
                loading: { ...prev.loading, [key]: false }
            }));
        }
    };

    const handleSwitchChange = async (key: string, value: boolean) => {
        const stringValue = value ? 'true' : 'false';
        
        setConfig(prev => ({
            ...prev,
            [key]: value
        }));
        
        const success = await updateConfig(key, stringValue);
        
        if (!success) {
            // Revert change if update failed
            setConfig(prev => ({
                ...prev,
                [key]: !value
            }));
        }
    };

    const handleForwarderServers = async () => {
        const { forwarderServer1, forwarderServer2 } = config;
        
        // Validate input length
        if (forwarderServer1.length > 100 || forwarderServer2.length > 100) {
            setError('Server names are too long');
            return;
        }
        
        const serversValue = [forwarderServer1, forwarderServer2]
            .filter(Boolean)
            .join(',');
        
        await updateConfig('forwarderServers', serversValue);
    };
    
    // Check if server values have changed
    const hasServerChanges = config.forwarderServer1 !== originalServers.server1 || 
                            config.forwarderServer2 !== originalServers.server2;

    if (isLoading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                DNS Resolver Configuration
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Forwarding Settings
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                    <Grid container alignItems="center" spacing={2}>
                        <Grid item>
                            <Typography variant="body1">Use Forwarder</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Enable DNS forwarding to external nameservers
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Switch
                                checked={config.useForwarder}
                                onChange={(e) => handleSwitchChange('useForwarder', e.target.checked)}
                                disabled={config.loading['useForwarder']}
                            />
                            {config.loading['useForwarder'] && <CircularProgress size={20} sx={{ ml: 1 }} />}
                        </Grid>
                    </Grid>
                </Box>
                
                <Box>
                    <Typography variant="body1" gutterBottom>
                        Forwarder Servers
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        External DNS servers to forward queries to (max 2 servers)
                    </Typography>
                    
                    <Grid container spacing={2} alignItems="flex-start">
                        <Grid item xs={12} md={5}>
                            <TextField
                                label="Primary Nameserver"
                                fullWidth
                                value={config.forwarderServer1}
                                onChange={(e) => setConfig(prev => ({ ...prev, forwarderServer1: e.target.value }))}
                                placeholder="e.g. 8.8.8.8"
                                error={config.forwarderServer1.length > 100}
                                helperText={config.forwarderServer1.length > 100 ? "Server name too long" : ""}
                                disabled={!config.useForwarder}
                            />
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <TextField
                                label="Secondary Nameserver"
                                fullWidth
                                value={config.forwarderServer2}
                                onChange={(e) => setConfig(prev => ({ ...prev, forwarderServer2: e.target.value }))}
                                placeholder="e.g. 8.8.4.4"
                                error={config.forwarderServer2.length > 100}
                                helperText={config.forwarderServer2.length > 100 ? "Server name too long" : ""}
                                disabled={!config.useForwarder}
                            />
                        </Grid>
                        <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Fade in={hasServerChanges} unmountOnExit timeout={300}>
                                <div> {/* Wrapper div needed for Fade to work properly */}
                                    <Button 
                                            variant="contained" 
                                            onClick={handleForwarderServers}
                                            disabled={Boolean(!config.useForwarder || config.loading['forwarderServers'] || (config.forwarderServer1 && !validateAContent(config.forwarderServer1)) || (config.forwarderServer2 && !validateAContent(config.forwarderServer2)))}
                                            sx={{ height: 56 }}
                                    >
                                            {config.loading['forwarderServers'] ? <CircularProgress size={24} /> : "Save"}
                                    </Button>
                                </div>
                            </Fade>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
            
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ResolverPage;