/**
 * Declaration module for dns2, a DNS server and client implementation for Node.js.
 * 
 * @module dns2
 * 
 * @remarks
 * This module provides interfaces and functions for creating DNS servers,
 * handling DNS packets, and processing DNS requests and responses.
 * 
 * The key components include:
 * - {@link DnsHeader} - Structure for DNS packet headers
 * - {@link DnsQuestion} - Represents questions/queries in DNS packets
 * - {@link DnsResourceRecord} - Represents resource records (answers, authorities, additionals)
 * - {@link DnsPacket} - Complete DNS packet structure
 * - {@link DnsServerOptions} - Configuration options for DNS servers
 * - {@link DnsServer} - DNS server instance with TCP/UDP support
 * - {@link Packet} - Utility for handling DNS packets
 * - {@link createServer} - Factory function to create a new DNS server
 */
declare module 'dns2' {
    export interface DnsHeader {
        id: number;                // Transaction identifier
        qr: number;                // Query/Response flag (0 = query, 1 = response)
        opcode: number;            // Operation code (0 = standard query, 1 = inverse query, etc.)
        aa: number;                // Authoritative Answer flag
        tc: number;                // Truncation flag (1 = message was truncated)
        rd: number;                // Recursion Desired flag
        ra: number;                // Recursion Available flag
        z: number;                 // Reserved (must be zero)
        rcode: number;             // Response code (0 = no error, 1 = format error, etc.)
        qdcount: number;           // Number of entries in question section
        nscount: number;           // Number of authority records
        arcount: number;           // Number of additional records
        ancount: number;           // Number of answer records
    }

    export interface DnsQuestion {
        name: string;              // Domain name being queried
        type: number;              // Record type being queried (1 = A, 28 = AAAA, etc.)
        class: number;             // Class of the query (typically 1 for Internet)
    }

    export interface DnsResourceRecord {
        name: string;              // Domain name this record applies to
        type: number;              // Record type (1 = A, 28 = AAAA, etc.)
        class: number;             // Class of the record (typically 1 for Internet)
        ttl: number;               // Time-to-live in seconds (how long to cache)
        address?: string;          // IP address for A/AAAA records
        data?: string;             // Data for other record types (MX, TXT, etc.)
    }

    export interface DnsPacket {
        header: DnsHeader;
        questions: DnsQuestion[];
        answers: DnsResourceRecord[];
        authorities: DnsResourceRecord[];    // Authority section records
        additionals: DnsResourceRecord[];    // Additional information records
    }

    export interface DnsServerOptions {
        udp?: boolean | object;    // UDP server configuration or false to disable
        tcp?: boolean | object;    // TCP server configuration or false to disable
        handle: (request: DnsPacket, send: (response: DnsPacket) => void, rinfo: any) => void | Promise<void>;
    }

    export interface DnsServer {
        on(event: 'request' | 'listening' | 'close', callback: (...args: any[]) => void): void;
        listen(options: {
            udp?: { port: number; address: string };
            tcp?: { port: number; address: string };
        }): void;
    }

    export const Packet: {
        createResponseFromRequest: (request: DnsPacket) => DnsPacket;    // Creates a response packet based on a request
    };

    export function createServer(options: DnsServerOptions): DnsServer;   
}
