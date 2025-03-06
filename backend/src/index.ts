import { startServer } from './server';
import app from './app';
import { PrismaClient } from '@prisma/client';
import init from './init';
import { startDNSServer } from './dns';
import fs from 'fs';
import { DnsLogWorker } from './workers/logworker';

const WEBPORT = process.env.WEBPORT || 40222;
const DNSPORT = process.env.DNSPORT || 53;

const prisma = new PrismaClient();

(async () => {
    if (!(await prisma.config.findUnique({
        where: { key: 'init' }
    }))) return init();
})();

export const logger = new DnsLogWorker(
    process.env.LOGDIR || (fs.existsSync('/data') ? '/data/logs' : 'data/logs'),
    parseInt(process.env.LOGRETENTIONDAYS || '7')
);

startServer(WEBPORT).catch(() => {
    process.exit(1);
});

startDNSServer(DNSPORT).catch(() => {
    process.exit(1);
});

export default app;
export { prisma };