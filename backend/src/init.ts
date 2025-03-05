import { prisma } from ".";
import crypto from 'crypto';
import { HashPW } from "./utils/authUser";

export default async function init() {
    console.log("Fresh install detected. Initializing...");

    console.log("Wiping all data...");
    await prisma.config.deleteMany();
    await prisma.user.deleteMany();
    await prisma.zone.deleteMany();
    await prisma.record.deleteMany();

    console.log("Creating default config...");
    await prisma.config.createMany({
        data: [
            {
                key: 'useForwarder',
                value: 'true'
            },
            {
                key: 'forwarderServers',
                value: '1.1.1.1,8.8.8.8'
            }
        ]
    })

    console.log("Creating default user...");
    await prisma.user.create({
        data: {
            id: 1,
            username: 'admin',
            name: 'Administrator',
            email: null,
            password: HashPW('admin'),
            isApi: false,
            token: crypto.randomBytes(32).toString('hex')
        }
    });
    console.log("----------------------------------------");
    console.log("Default user created.");
    console.log("Username: admin");
    console.log("Password: admin");
    console.log("Please change the password immediately.");
    console.log("----------------------------------------");
    


    await prisma.config.create({
        data: {
            key: 'init',
            value: 'true'
        }
    });
    console.log("Initialization complete.");
}