import fs from 'fs';
import { spawn, exec } from 'child_process';

export const dataDir = fs.existsSync('/data') ? '/data' : 'data'

export default async function setupCheck() {
    console.log("Checking setup...");
    console.log("----------------------------------------");

    // Check SSL certificates
    if (process.env.USEHTTP !== "true") {
        if (!fs.existsSync(`${dataDir}/certs/cert.pem`) || !fs.existsSync(`${dataDir}/certs/key.pem`)) {
            console.warn("SSL certificates not found. Generating self-signed certificates...");

            if (!fs.existsSync(`${dataDir}/certs`)) fs.mkdirSync(`${dataDir}/certs`);

            await new Promise((resolve, reject) => {
                const p = exec(`openssl req -x509 -newkey rsa:4096 -keyout ${dataDir}/certs/key.pem -out ${dataDir}/certs/cert.pem -days 365 -nodes -subj '/CN=localhost'`, (err) => {
                    if (err) {
                        console.error("Failed to generate certificates. Exiting...");
                        process.exit(1);
                    }
                });

                p.once('exit', resolve);
            });
        }
        console.log("✅ SSL certificates");
    }


    console.log("----------------------------------------");
    console.log("Setup check complete.");
}