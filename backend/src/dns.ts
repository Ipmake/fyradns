import dns2 from 'dns2';
import { logger, prisma } from '.';
import { MxRecord, resolveCaa, Resolver, SoaRecord, SrvRecord } from 'node:dns';
import { $Enums, Prisma } from '@prisma/client';
import { logLevelStrings } from './workers/logworker';
import { WorkerPool } from './dns/worker-pool';
import { cpus } from 'node:os';
import path from 'node:path';

interface ExtendedDnsQuestion extends dns2.DnsQuestion {
    type: number;
    class: number;
}

// Map DNS record type numbers to strings
const typeMap: Record<number, string> = {
    1: 'A',
    28: 'AAAA',
    5: 'CNAME',
    15: 'MX',
    2: 'NS',
    12: 'PTR',
    6: 'SOA',
    33: 'SRV',
    16: 'TXT'
};

// Define specific return types for each DNS record type
type ResolveResult<T extends $Enums.RecordType> =
    T extends 'A' ? string[] :
    T extends 'AAAA' ? string[] :
    T extends 'CNAME' ? string[] :
    T extends 'MX' ? MxRecord[] :
    T extends 'NS' ? string[] :
    T extends 'PTR' ? string[] :
    T extends 'SOA' ? SoaRecord :
    T extends 'SRV' ? SrvRecord[] :
    T extends 'TXT' ? string[][] :
    null;

const resolveAny = <T extends $Enums.RecordType>(
    resolver: Resolver,
    name: string,
    type: T
): Promise<ResolveResult<T> | null> => {
    return new Promise((resolve, reject) => {
        switch (type) {
            case 'A':
                return resolver.resolve4(name, (err, addresses) => {
                    if (err) resolve(null);
                    resolve(addresses as ResolveResult<T>);
                });
            case 'AAAA':
                return resolver.resolve6(name, (err, addresses) => {
                    if (err) resolve(null);
                    resolve(addresses as ResolveResult<T>);
                });
            case 'CNAME':
                return resolver.resolveCname(name, (err, addresses) => {
                    if (err) resolve(null);
                    resolve(addresses as ResolveResult<T>);
                });
            case 'MX':
                return resolver.resolveMx(name, (err, addresses) => {
                    if (err) resolve(null);
                    resolve(addresses as ResolveResult<T>);
                });
            case 'NS':
                return resolver.resolveNs(name, (err, addresses) => {
                    if (err) resolve(null);
                    resolve(addresses as ResolveResult<T>);
                });
            case 'PTR':
                return resolver.resolvePtr(name, (err, addresses) => {
                    if (err) resolve(null);
                    resolve(addresses as ResolveResult<T>);
                });
            case 'SOA':
                return resolver.resolveSoa(name, (err, addresses) => {
                    if (err) resolve(null);
                    resolve(addresses as ResolveResult<T>);
                });
            case 'SRV':
                return resolver.resolveSrv(name, (err, addresses) => {
                    if (err) resolve(null);
                    resolve(addresses as ResolveResult<T>);
                });
            case 'TXT':
                return resolver.resolveTxt(name, (err, addresses) => {
                    if (err) resolve(null);
                    resolve(addresses as ResolveResult<T>);
                });
            default:
                resolve(null);
                return;
        }
    });
}

const resolver = new Resolver();

// Function to update forwarder DNS servers
export async function updateForwarderServers(): Promise<boolean> {
    try {
        const config = await prisma.config.findMany({
            where: {
                key: {
                    in: ['useForwarder', 'forwarderServers']
                }
            }
        });

        const useForwarder = config.find(c => c.key === 'useForwarder')?.value === 'true';
        const forwarderServers = config.find(c => c.key === 'forwarderServers')?.value.split(',');

        if (useForwarder && forwarderServers && forwarderServers.length > 0) {
            resolver.setServers(forwarderServers.slice(0, 2));
            console.log('Updated forwarder DNS servers:', forwarderServers.slice(0, 2));
            return true;
        }
        return false;
    } catch (err) {
        console.error('Failed to update forwarder DNS servers:', err);
        return false;
    }
}


export async function startDNSServer(port: number | string) {
    try {
        // Calculate optimal number of workers (leave 1 core for main thread)
        const numWorkers = Math.max(1, cpus().length - 1);
        
        // Create worker pool
        const workerPool = new WorkerPool(
            path.resolve(__dirname, 'dns', 'worker.js'),
            numWorkers
        );

        const server = dns2.createServer({
            udp: true,
            handle: async (request, send, rinfo) => {
                workerPool.handleTask(request, rinfo, send);
            }
        });

        server.on('listening', () => {
            console.log(`DNS server listening on port ${port}`);
        });

        server.on('close', () => {
            console.log('server closed');
        });

        server.listen({
            udp: {
                port: parseInt(port as string),
                address: '0.0.0.0'
            },
            tcp: {
                port: parseInt(port as string),
                address: '0.0.0.0'
            }
        });

    } catch (err) {
        console.error('Failed to start server:', err);
        throw err;
    }
}