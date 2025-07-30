export interface SystemStats {
    cpu: {
        count: number;
        usage: number;
        frequecy: number | null;
    };
    memory: {
        total: string;
        used: string;
        available: string;
        usage: number;
    };
    disk: {
        total: string;
        used: string;
        free: string;
        usage: number;
    };
    network: {
        bytes_sent: number;
        bytes_recv: number;
        packets_sent: number;
        packets_recv: number;
    };
}