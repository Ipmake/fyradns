import dns2 from 'dns2';
import { prisma } from '.';
import { MxRecord, resolveCaa, Resolver, SoaRecord, SrvRecord } from 'node:dns';
import { $Enums } from '@prisma/client';

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

export async function startDNSServer(port: number | string) {
    const resolver = new Resolver();

    try {
        const server = dns2.createServer({
            udp: true,
            handle: async (request, send, _rinfo) => {
                const response = dns2.Packet.createResponseFromRequest(request);
                const question = (request.questions as ExtendedDnsQuestion[])[0];

                // Skip if no question
                if (!question) {
                    response.header.rcode = 2;
                    return send(response);
                }

                try {
                    const recordType = typeMap[question.type] || 'A';
                    const nameParts = question.name.split('.');

                    const subDomain = nameParts.slice(0, -2).join('.');
                    const zone = nameParts.slice(-2).join('.');

                    // Single query that fetches both records and zone information
                    const [records, zoneInDb, config] = await prisma.$transaction([
                        prisma.record.findMany({
                            where: {
                                zoneDomain: zone,
                                type: recordType,
                                enabled: true,
                                name: {
                                    in: [subDomain, '@', '*']
                                },
                                zone: {
                                    enabled: true
                                }
                            },
                            include: {
                                zone: true
                            },
                            orderBy: {
                                priority: 'asc'
                            }
                        }),
                        prisma.zone.findFirst({
                            where: {
                                domain: zone,
                                enabled: true
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

                    // Check if zone exists by looking at any returned record
                    const zoneExists = zoneInDb !== null;

                    // Group records by specificity
                    const exactMatches = records.filter(r => r.name === subDomain);
                    const rootMatches = records.filter(r => r.name === '@');
                    const wildcardMatches = records.filter(r => r.name === '*');

                    // Priority: exact match > root match > wildcard match
                    // Determine matching records by priority
                    let matchingRecords;

                    if (exactMatches.length > 0) matchingRecords = exactMatches;
                    else if (rootMatches.length > 0 && subDomain === "") matchingRecords = rootMatches;
                    else matchingRecords = wildcardMatches;

                    // Process only the matching records
                    for (const record of matchingRecords) {
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
                        if (!zoneExists &&(useForwarder && forwarderServers)) {
                            resolver.setServers(forwarderServers.slice(0, 2));

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
                                    name: zoneInDb.domain,
                                    type: 6, // SOA
                                    class: 1,
                                    ttl: zoneInDb.ttl || 3600,
                                    data: `${zoneInDb.domain} local@local ${zoneInDb.serial} ${zoneInDb.refresh} ${zoneInDb.retry} ${zoneInDb.expire} ${zoneInDb.minimum}`
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
                            const zone = records[0].zone;
                            response.authorities.push({
                                name: zone.domain,
                                type: 6,
                                class: 1,
                                ttl: zone.ttl || 3600,
                                data: `${zone.domain} local@local ${zone.serial} ${zone.refresh} ${zone.retry} ${zone.expire} ${zone.minimum}`
                            } as dns2.DnsResourceRecord);
                        }
                    }
                } catch (err) {
                    console.error('Failed to process request:', err);
                    response.header.rcode = 2;
                }

                send(response);
            }
        });

        // server.on('request', (request, response, rinfo) => {
        //     console.log(request.header.id, request.questions[0]);
        // });

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