import dns2 from 'dns2';
import { logger, prisma } from '.';
import { MxRecord, resolveCaa, Resolver, SoaRecord, SrvRecord } from 'node:dns';
import { $Enums, Prisma } from '@prisma/client';
import { logLevelStrings } from './workers/logworker';

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
        // Initialize forwarder DNS servers
        await updateForwarderServers();

        // Set up timer to update forwarder DNS servers every 5 minutes
        const updateInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
        setInterval(async () => {
            try {
                await updateForwarderServers();
            } catch (err) {
                console.error('Error in scheduled forwarder update:', err);
            }
        }, updateInterval);

        const server = dns2.createServer({
            udp: true,
            handle: async (request, send, _rinfo) => {
                const response = dns2.Packet.createResponseFromRequest(request);
                const question = (request.questions as ExtendedDnsQuestion[])[0];

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
                            ip: _rinfo.address,
                            port: _rinfo.port
                        }
                    })
                    return send(response);
                }

                try {
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
                    const [recordsWithZones, config] = await prisma.$transaction([
                        // Query for records across all possible zones
                        prisma.record.findMany({
                            where: {
                                zoneDomain: {
                                    in: possibleZones
                                },
                                type: recordType,
                                enabled: true,
                                zone: {
                                    enabled: true
                                }
                            },
                            include: {
                                zone: true
                            },
                            orderBy: [
                                {
                                    priority: 'asc'
                                }
                            ]
                        }),
                        prisma.config.findMany({
                            where: {
                                key: {
                                    in: ['useForwarder', 'forwarderServers']
                                }
                            }
                        })
                    ]);

                    let matchingRecords: typeof recordsWithZones[0][] = [];
                    let zoneExists = false;
                    let zone: string = "";
                    let subDomain: string = "";

                    if (recordsWithZones.length > 0) {
                        // Group records by zoneDomain
                        const recordsByZone = recordsWithZones.reduce((acc, record) => {
                            if (!acc[record.zoneDomain]) acc[record.zoneDomain] = [];
                            acc[record.zoneDomain].push(record);
                            return acc;
                        }, {} as Record<string, typeof recordsWithZones[0][]>);

                        // Find the longest matching zone that has records
                        const matchingZoneDomain = possibleZones.find(zone => recordsByZone[zone]?.length > 0);

                        if (matchingZoneDomain) {
                            const records = recordsByZone[matchingZoneDomain];

                            const SubDomain = question.name.endsWith(matchingZoneDomain)
                                ? question.name.slice(0, -(matchingZoneDomain.length + 1)) || '@'
                                : question.name;


                            // Group records by specificity
                            const exactMatches = records.filter(r => r.name === SubDomain);
                            const rootMatches = records.filter(r => r.name === '@');
                            const wildcardMatches = records.filter(r => r.name === '*');

                            // Priority: exact match > root match > wildcard match
                            // Determine matching records by priority

                            if (exactMatches.length > 0) {
                                matchingRecords = exactMatches;
                            } else if (rootMatches.length > 0 && SubDomain === '@') {
                                matchingRecords = rootMatches;
                            } else if (wildcardMatches.length > 0) {
                                matchingRecords = wildcardMatches;
                            } else if (rootMatches.length > 0) {
                                matchingRecords = rootMatches;
                            } else {
                                // No matching records found
                                matchingRecords = [];
                            }

                            zoneExists = true;
                            zone = matchingZoneDomain;
                            subDomain = SubDomain;
                        }
                    }

                    // Process only the matching records
                    for (const record of (zoneExists ? matchingRecords : [])) {
                        let recordName = question.name;

                        // Handle special record names
                        if (record.name === '@') {
                            recordName = zone;
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

                    // Set response headers explicitly
                    response.header.qr = 1; // This is a response
                    response.header.aa = 1; // Authoritative answer
                    response.header.rd = 1; // Recursion desired
                    response.header.ra = 1; // Recursion available

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

                                // Add SOA record in authority section for negative caching
                                response.authorities.push({
                                    name: zone,
                                    type: 6, // SOA
                                    class: 1,
                                    ttl: 1, // 1 second
                                    data: `${zone} local@local 0 0 0 0 0`
                                } as dns2.DnsResourceRecord);
                            } else {
                                // Domain doesn't exist at all - return NXDOMAIN
                                response.header.rcode = 3; // NXDOMAIN
                            }
                        }
                    } else {
                        response.header.ancount = response.answers.length;
                        response.header.rcode = 0; // No error

                        // If authoritative, add proper SOA record
                        if (zoneExists) {
                            response.authorities.push({
                                name: zone,
                                type: 6, // SOA
                                class: 1,
                                ttl: 1, // 1 second
                                data: `${zone} local@local 0 0 0 0 0`
                            } as dns2.DnsResourceRecord);
                        }
                    }
                } catch (err) {
                    console.error('Failed to process request:', err);
                    response.header.rcode = 2;
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
                        ip: _rinfo.address,
                        port: _rinfo.port
                    }
                });

                send(response);
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