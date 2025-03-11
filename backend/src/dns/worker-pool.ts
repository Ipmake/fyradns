import { Worker } from 'worker_threads';
import { cpus } from 'os';
import path from 'path';
import { DnsPacket, Packet } from 'dns2';

export class WorkerPool {
    private workers: Worker[] = [];
    private nextWorkerId = 0;
    private activeRequests = new Map<string, {
        data: DnsPacket;
        rinfo: any;
        send: (response: DnsPacket) => void;
    }>();
    private maxWorkers: number;

    constructor(workerScript: string, maxWorkers = cpus().length) {
        this.maxWorkers = maxWorkers;

        // Create worker threads
        for (let i = 0; i < this.maxWorkers; i++) {
            this.createWorker(workerScript);
        }

        console.log(`Created DNS worker pool with ${this.maxWorkers} workers`);
    }

    private createWorker(scriptPath: string) {
        const worker = new Worker(scriptPath);

        worker.on('message', (message: fyradns.WorkerEvent<{
            result: DnsPacket;
        }>) => {
            if (message.type !== 'dnsResponse') return;
            if (!this.activeRequests.has(message.id)) return;
            const task = this.activeRequests.get(message.id);

            if (!task) {
                console.error('Worker response for unknown task:', message.id);
                return;
            }

            if (!message.payload) {
                console.error('Worker response missing payload:', message.id);
                return;
            }


            const res = Packet.createResponseFromRequest(task.data)

            res.answers = message.payload.result.answers;
            res.authorities = message.payload.result.authorities;
            res.additionals = message.payload.result.additionals;
            res.header = message.payload.result.header;

            task.send(res);

            this.activeRequests.delete(message.id);
        });

        worker.on('error', (err) => {
            console.error('Worker error:', err);
            // Recreate the worker if it crashes
            this.workers = this.workers.filter(w => w !== worker);
            this.createWorker(scriptPath);
        });

        this.workers.push(worker);
    }

    public handleTask(data: DnsPacket, rinfo: any, send: (response: DnsPacket) => void): void {
        const taskId = Date.now() + Math.random().toString();
        this.activeRequests.set(taskId, {
            data,
            rinfo,
            send
        });

        // Round-robin distribution among workers
        const worker = this.workers[this.nextWorkerId];
        this.nextWorkerId = (this.nextWorkerId + 1) % this.workers.length;

        worker.postMessage({
            type: 'dnsRequest',
            id: taskId,
            payload: {
                data,
                rinfo
            }
        } satisfies fyradns.WorkerEvent<{
            data: DnsPacket;
            rinfo: any;
        }>);

        setTimeout(() => {
            if (!this.activeRequests.has(taskId)) return;
            console.error('Worker timed out:', taskId);
            this.activeRequests.delete(taskId);

            const res = Packet.createResponseFromRequest(data);
            res.header.rcode = 2; // SERVFAIL
            send(res);
        }, 5000);
    }

    public shutdown() {
        for (const worker of this.workers) {
            worker.terminate();
        }
    }
}