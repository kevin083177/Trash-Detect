export interface SystemStats {
    cpu: {
        count: number;
        usage: number;
        frequency: number;
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
    gpu?: {
        available: boolean;
        count?: number;
        gpus?: Array<{
            id: number;
            name: string;
            usage: number;
            memory_usage: number;
            memory_used: string;
            memory_total: string;
            temperature: string;
        }>;
    };
}