import { startServer } from './server';
import app from './app';
import { PrismaClient } from '@prisma/client';
import init from './init';

const WEBPORT = process.env.WEBPORT || 40222;
const DNSPORT = process.env.DNSPORT || 53;

const prisma = new PrismaClient();

(async () => {
    if (!(await prisma.config.findUnique({
        where: { key: 'init' }
    }))) return init();
})();

startServer(WEBPORT).catch(() => {
    process.exit(1);
});

export default app;
export { prisma };