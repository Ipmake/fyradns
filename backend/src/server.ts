import path from 'path';
import fs from 'fs/promises';
import app from './app';
import express from 'express';

export async function startServer(port: number | string) {
    const __dirname = process.cwd();
    const routesDir = path.join(__dirname, 'dist', 'routes');
    const wwwDir = path.join(__dirname, 'www');
    
    try {
        // Ensure routes directory exists
        await fs.mkdir(routesDir, { recursive: true }).catch(() => {});
        
        // Enable CORS for all requests
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });

        // Register API routes
        const { registerRoutes } = await import('./utils/routeLoader.js');
        await registerRoutes(app, routesDir, '/api');
        
        app.use(express.static(wwwDir));
               
        // For any other requests, send index.html for SPA routing
        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api/')) return next();
            res.sendFile(path.join(wwwDir, 'index.html'));
        });
        
        return app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        throw err;
    }
}