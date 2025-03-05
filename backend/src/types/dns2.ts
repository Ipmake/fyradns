
declare module 'dns2' {
    export interface DnsHeader {
        id: number;
        qr: number;
        opcode: number;
        aa: number;
        tc: number;
        rd: number;
        ra: number;
        z: number;
        rcode: number;
        qdcount: number;
        nscount: number;
        arcount: number;
        ancount: number;
    }

    export interface DnsQuestion {
        name: string;
        type: number;
        class: number;
    }

    export interface DnsResourceRecord {
        name: string;
        type: number;
        class: number;
        ttl: number;
        address?: string;
        data?: string;
    }

    export interface DnsPacket {
        header: DnsHeader;
        questions: DnsQuestion[];
        answers: DnsResourceRecord[];
        authorities: DnsResourceRecord[];
        additionals: DnsResourceRecord[];
    }

    export interface DnsServerOptions {
        udp?: boolean | object;
        tcp?: boolean | object;
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
        createResponseFromRequest: (request: DnsPacket) => DnsPacket;
    };

    export function createServer(options: DnsServerOptions): DnsServer;   
}
