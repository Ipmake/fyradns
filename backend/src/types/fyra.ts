declare namespace fyradns {
    interface WorkerEvent <T> {
        type: string;
        id: string;
        payload?: T;
    }
}