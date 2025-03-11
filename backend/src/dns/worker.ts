import { parentPort } from 'worker_threads';
import dns2, { DnsPacket } from 'dns2';
import { Resolver, MxRecord, SoaRecord, SrvRecord } from 'node:dns';
import { $Enums } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { DnsLogWorker, logLevelStrings } from '../workers/logworker';
import fs from 'fs';

interface ExtendedDnsQuestion extends dns2.DnsQuestion {
    type: number;
    class: number;
}

const prisma = new PrismaClient();
const resolver = new Resolver();
const logger = new DnsLogWorker(
    process.env.LOGDIR || (fs.existsSync('/data') ? '/data/logs' : 'data/logs'),
    parseInt(process.env.LOGRETENTIONDAYS || '7')
);

// Map DNS record type numbers to strings
const typeMap: Record<number, string> = {
    1: 'A', 28: 'AAAA', 5: 'CNAME', 15: 'MX', 2: 'NS',
    12: 'PTR', 6: 'SOA', 33: 'SRV', 16: 'TXT'
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
            return true;
        }
        return false;
    } catch (err) {
        console.error('Failed to update forwarder DNS servers:', err);
        return false;
    }
}

// Set up timer to update forwarder DNS servers periodically
updateForwarderServers();
setInterval(updateForwarderServers, 5 * 60 * 1000);

// Process DNS requests
async function processDnsRequest(requestData: DnsPacket, rinfo: any): Promise<DnsPacket> {
    const response: DnsPacket = {
        header: {
            id: requestData.header.id,
            qr: 0,
            opcode: 0,
            aa: 0,
            tc: 0,
            rd: 0,
            ra: 0,
            z: 0,
            rcode: 0,
            qdcount: 1,
            ancount: 0,
            nscount: 0,
            arcount: 0
        },
        questions: [],
        answers: [],
        authorities: [],
        additionals: []
    }
    const question = (requestData.questions as ExtendedDnsQuestion[])[0];

    // Skip if no question
    if (!question) {
        response.header.rcode = 1;
        logger.writeLogEntry({
            timestamp: new Date(),
            level: 1,
            query: {
                name: '',
                type: '',
                class: ''
            },
            response: {
                code: 'FORMERR'
            },
            client: {
                ip: rinfo.address,
                port: rinfo.port
            }
        })
        return response;
    }

    try {

        // Set response headers explicitly
        response.header.qr = 1; // This is a response
        response.header.aa = 1; // Authoritative answer
        response.header.rd = 0; // Recursion desired
        response.header.ra = 1; // Recursion available

        const recordType = typeMap[question.type] || 'A';
        const nameParts = question.name.split('.');

        // Generate all possible parent zones from the domain
        const possibleZones = [];
        // Start from i=0 to include the full domain itself
        for (let i = 0; i < nameParts.length; i++) {
            const zoneParts = nameParts.slice(i);
            // Only add if we have at least one part
            if (zoneParts.length > 0) {
                possibleZones.push(zoneParts.join('.'));
            }
        }

        possibleZones.sort((a, b) => b.length - a.length);

        // Execute a single transaction with optimized queries
        const [zonesInDb, config] = await prisma.$transaction([
            prisma.zone.findMany({
                where: {
                    domain: {
                        in: possibleZones
                    },
                    enabled: true
                },
                include: {
                    acl: true,
                    records: {
                        where: {
                            type: recordType,
                            enabled: true
                        },
                        orderBy: {
                            priority: 'asc'
                        }
                    }
                }
            }),
            prisma.config.findMany({
                where: {
                    key: {
                        in: ['useForwarder', 'forwarderServers']
                    }
                }
            })
        ]);

        // Sort zoneInDb by length in descending order
        zonesInDb.sort((a, b) => b.domain.length - a.domain.length);

        // Find the longest matching zone
        const zone = zonesInDb.find(z => question.name.endsWith(z.domain));

        let matchingRecords: typeof zonesInDb[0]["records"] = [];
        let zoneExists = zone ? true : false;
        let subDomain: string = "";
        let aclInfo: { ipAddresses: string; enabled: boolean } | null = zoneExists ? {
            ipAddresses: zone?.acl?.ipAddresses || '',
            enabled: zone?.acl?.enabled || false
        } : null;

        if(zoneExists && zone) {
            const SubDomain = question.name.endsWith(zone.domain)
                ? question.name.slice(0, -(zone.domain.length + 1)) || '@'
                : question.name;

            // Group records by specificity
            const exactMatches = zone.records.filter(r => r.name === SubDomain);
            const rootMatches = zone.records.filter(r => r.name === '@');
            const wildcardMatches = zone.records.filter(r => r.name === '*');

            // Priority: exact match > root match > wildcard match
            // Determine matching records by priority

            if (exactMatches.length > 0) {
                matchingRecords = exactMatches;
            } else if (rootMatches.length > 0 && SubDomain === '@') {
                matchingRecords = rootMatches;
            } else if (wildcardMatches.length > 0) {
                matchingRecords = wildcardMatches;
            } else {
                // No matching records found
                matchingRecords = [];
            }

            subDomain = SubDomain;
        }


        // Add SOA record for the zone
        if (zoneExists) response.authorities.push({
            name: zone?.domain,
            type: 6, // SOA
            class: 1,
            ttl: zone?.ttl,
            data: `${zone} ${zone?.soaemail} ${zone?.serial} ${zone?.refresh} ${zone?.retry} ${zone?.expire} ${zone?.ttl}`
        } as dns2.DnsResourceRecord);


        // Check ACL for zone - only if zone exists and ACL is enabled
        if (zoneExists && aclInfo && aclInfo.enabled) {
            const clientIp = rinfo.address;

            // Parse ACL rules - assuming ipAddresses is a comma-separated list or CIDR notation
            const allowedIps = aclInfo.ipAddresses.split(',').map(ip => ip.trim());

            // Check if client IP is allowed
            const isAllowed = allowedIps.some(allowedIp => {
                // Check for wildcard - allow all IPs
                if (allowedIp === '*') return true;

                // Handle CIDR notation (e.g., 192.168.178.0/24)
                // Do not touch it just works.
                if (allowedIp.includes('/')) {
                    const [subnet, prefixStr] = allowedIp.split('/');
                    const prefix = parseInt(prefixStr, 10);

                    // Convert both IPs to binary representation for comparison
                    const ipBinary = clientIp.split('.').map((octet: string) =>
                        parseInt(octet, 10).toString(2).padStart(8, '0')).join('');
                    const subnetBinary = subnet.split('.').map((octet: string) =>
                        parseInt(octet, 10).toString(2).padStart(8, '0')).join('');

                    // Compare only the network portion (prefix length)
                    return ipBinary.substring(0, prefix) === subnetBinary.substring(0, prefix);
                }

                // Simple exact match for single IP addresses
                return clientIp === allowedIp;
            });

            if (!isAllowed) {
                // Return REFUSED (5) for unauthorized access
                response.header.rcode = 5; // REFUSED
                logger.writeLogEntry({
                    timestamp: new Date(),
                    level: 5, // REFUSED
                    query: {
                        name: question.name,
                        type: typeMap[question.type] || 'A',
                        class: question.class === 1 ? 'IN' : 'UNKNOWN'
                    },
                    response: {
                        code: 'REFUSED'
                    },
                    client: {
                        ip: rinfo.address,
                        port: rinfo.port
                    }
                });
                return response;
            }
        }

        // Process only the matching records
        for (const record of (zoneExists ? matchingRecords : [])) {
            let recordName = question.name;

            // Handle special record names
            if (record.name === '@') {
                recordName = zone?.domain || '';
            } else if (record.name !== subDomain && record.name !== '*') {
                recordName = `${record.name}.${zone}`;
            }

            const resourceRecord: dns2.DnsResourceRecord = {
                name: recordName,
                type: question.type,
                class: question.class,
                ttl: record.ttl,
                data: record.content,
                address: record.content
            };

            // Add record to response
            response.answers.push(resourceRecord);
            break;
        }

        const useForwarder = config.find(c => c.key === 'useForwarder')?.value === 'true';
        const forwarderServers = config.find(c => c.key === 'forwarderServers')?.value.split(',');

        if (!response.answers.length) {
            // if forwarder is enabled, forward the request
            if (!zoneExists && useForwarder && forwarderServers) {
                // No need to set forwarder servers here - already set by updateForwarderServers()

                const answer = await resolveAny(resolver, question.name, recordType as $Enums.RecordType);
                if (answer) {
                    switch (recordType) {
                        case 'A':
                            (answer as string[]).forEach(ip => {
                                response.answers.push({
                                    name: question.name,
                                    type: question.type,
                                    class: question.class,
                                    ttl: 300,
                                    address: ip
                                });
                            });
                            break;
                        case 'AAAA':
                            (answer as string[]).forEach(ip => {
                                response.answers.push({
                                    name: question.name,
                                    type: question.type,
                                    class: question.class,
                                    ttl: 300,
                                    address: ip
                                });
                            });
                            break;
                        case 'CNAME':
                            (answer as string[]).forEach(cname => {
                                response.answers.push({
                                    name: question.name,
                                    type: question.type,
                                    class: question.class,
                                    ttl: 300,
                                    data: cname
                                });
                            });
                            break;
                        case 'MX':
                            (answer as MxRecord[]).forEach(mx => {
                                response.answers.push({
                                    name: question.name,
                                    type: question.type,
                                    class: question.class,
                                    ttl: 300,
                                    data: `${mx.priority} ${mx.exchange}`
                                });
                            });
                            break;
                        case 'NS':
                            (answer as string[]).forEach(ns => {
                                response.answers.push({
                                    name: question.name,
                                    type: question.type,
                                    class: question.class,
                                    ttl: 300,
                                    data: ns
                                });
                            });
                            break;
                        case 'PTR':
                            (answer as string[]).forEach(ptr => {
                                response.answers.push({
                                    name: question.name,
                                    type: question.type,
                                    class: question.class,
                                    ttl: 300,
                                    data: ptr
                                });
                            });
                            break;
                        case 'SOA':
                            const soa = answer as SoaRecord;
                            response.answers.push({
                                name: question.name,
                                type: question.type,
                                class: question.class,
                                ttl: 300,
                                data: `${soa.nsname} ${soa.hostmaster} ${soa.serial} ${soa.refresh} ${soa.retry} ${soa.expire} ${soa.minttl}`
                            });
                            break;
                        case 'SRV':
                            (answer as SrvRecord[]).forEach(srv => {
                                response.answers.push({
                                    name: question.name,
                                    type: question.type,
                                    class: question.class,
                                    ttl: 300,
                                    data: `${srv.priority} ${srv.weight} ${srv.port} ${srv.name}`
                                });
                            });
                            break;
                        case 'TXT':
                            (answer as string[][]).forEach(txt => {
                                response.answers.push({
                                    name: question.name,
                                    type: question.type,
                                    class: question.class,
                                    ttl: 300,
                                    data: txt.join('')
                                });
                            });
                            break;
                    }

                    if (response.answers.length > 0) {
                        response.header.ancount = response.answers.length;
                        response.header.rcode = 0; // No error
                    }
                } else {
                    // No records found - return NOERROR with empty answers
                    response.header.rcode = 0; // NOERROR
                }
            } else {
                if (zoneExists) {
                    // Domain exists but no record of this type - return NOERROR with empty answers
                    response.header.rcode = 0; // NOERROR
                } else {
                    // Domain doesn't exist at all - return NXDOMAIN
                    response.header.rcode = 3; // NXDOMAIN
                }
            }
        } else {
            response.header.ancount = response.answers.length;
            response.header.rcode = 0; // No error
        }

        logger.writeLogEntry({
            timestamp: new Date(),
            level: response.header.rcode,
            query: {
                name: question.name,
                type: typeMap[question.type] || 'A',
                class: question.class === 1 ? 'IN' : 'UNKNOWN'
            },
            response: {
                code: !isNaN(response.header.rcode) ? logLevelStrings[response.header.rcode] : 'SERVFAIL'
            },
            client: {
                ip: rinfo.address,
                port: rinfo.port
            }
        });

        return response;

    } catch (err) {
        console.error('Error processing DNS request:', err);
        response.header.rcode = 2;
        logger.writeLogEntry({
            timestamp: new Date(),
            level: 1,
            query: {
                name: question.name,
                type: typeMap[question.type] || '',
                class: question.class.toString()
            },
            response: {
                code: 'SERVFAIL'
            },
            client: {
                ip: rinfo.address,
                port: rinfo.port
            }
        });

        return response;
    }
}

// Handle messages from the parent thread
parentPort?.on('message', async (message: fyradns.WorkerEvent<{
    data: DnsPacket;
    rinfo: any;
}>) => {
    if (message.type !== 'dnsRequest') return;
    if (!message.payload) return;

    const result = await processDnsRequest(message.payload.data, message.payload.rinfo);
    parentPort?.postMessage({
        type: 'dnsResponse',
        id: message.id,
        payload: {
            result
        }
    } satisfies fyradns.WorkerEvent<{
        result: DnsPacket;
    }>);
});