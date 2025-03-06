import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import { createWriteStream, WriteStream, promises as fsPromises } from 'fs';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

// Define log levels
enum LogLevel {
    NOERROR = 0, // 0
    FORMERR = 1, // 1
    SERVFAIL = 2, // 2
    NXDOMAIN = 3, // 3
    NOTIMP = 4, // 4
    REFUSED = 5, // 5
    YXDOMAIN = 6, // 6
    XRRSET = 7, // 7
    NOTAUTH = 8, // 9
    NOTZONE = 9, // 10
}

const logLevelStrings = [
    'NOERROR',
    'FORMERR',
    'SERVFAIL',
    'NXDOMAIN',
    'NOTIMP',
    'REFUSED',
    'YXDOMAIN',
    'XRRSET',
    'NOTAUTH',
    'NOTZONE',
]

// Define a DNS log entry structure
interface DnsLogEntry {
    timestamp: Date;
    level: LogLevel;
    query?: {
        name?: string;
        type?: string;
        class?: string;
    };
    response?: {
        code?: string;
        // answers?: any[];
    };
    client?: {
        ip?: string;
        port?: number;
    };
}

class DnsLogWorker {
    private logDir: string;
    private currentLogFile: string;
    private writeStream: WriteStream | null = null;

    constructor(
        logDir: string = path.join(process.cwd(), 'logs'),
        logRetentionDays: number = 7
    ) {
        this.logDir = logDir;
        this.currentLogFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);

        if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir, { recursive: true });

        // read the log dir and delete old log files older than logRetentionDays
        const clearLogs = () => {
            fsPromises.readdir(this.logDir).then((files) => {
                const now = Date.now();
                const retentionTime = logRetentionDays * 24 * 60 * 60 * 1000;
                files.forEach(async (file) => {
                    const filePath = path.join(this.logDir, file);
                    const stats = await fsPromises.stat(filePath);
                    if (now - stats.mtimeMs > retentionTime) {
                        await fsPromises.unlink(filePath);
                    }
                });
            });
        }

        clearLogs();
        setInterval(clearLogs, 4 * 60 * 60 * 1000);
    }

    private async createWriteStream() {
        if (this.writeStream) {
            this.writeStream.close();
        }
        this.writeStream = createWriteStream(this.currentLogFile, { flags: 'a' });
    }

    public async writeLogEntry(entry: DnsLogEntry) {
        if (!this.writeStream) await this.createWriteStream();
        this.writeStream?.write(`${Date.now()}|${JSON.stringify(entry)}\n`);
    }

    public async readLogEntries(date: number, limit: number = 100): Promise<DnsLogEntry[]> {
        const logFile = path.join(this.logDir, `${new Date(date).toISOString().split('T')[0]}.log`);
        if (!fs.existsSync(logFile)) return [];

        try {
            // Use tail to get only the last lines we need (we request more lines to account for empty lines)
            const { stdout } = await exec(`tail -n ${limit * 2} "${logFile}"`);
            if (!stdout) return [];

            const lines = stdout.split('\n');
            const entries: DnsLogEntry[] = [];

            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].trim() === "") continue;
                if (entries.length >= limit) break;

                try {
                    const parts = lines[i].split('|');
                    entries.push(JSON.parse(parts[1]));
                } catch (err) {
                    // Skip invalid lines
                    console.error('Error parsing log entry:', err);
                }
            }

            return entries;
        } catch (error) {
            console.error('Error reading log file:', error);
            return [];
        }
    }

    public async close() {
        if (this.writeStream) this.writeStream.close();
    }

}

export { DnsLogWorker, LogLevel, DnsLogEntry, logLevelStrings };