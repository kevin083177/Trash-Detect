import { io, Socket } from 'socket.io-client';
import type { SystemStats } from '../interfaces/system';
import { SOCKET_URL } from '../api/api';

class SocketService {
    private socket: Socket | null = null;
    private readonly SOCKET_URL = SOCKET_URL;

    constructor () {
        this.socket = null;
    }
    connect(): Promise<Socket> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = io(this.SOCKET_URL, {
                    transports: ['websocket'],
                    timeout: 5000,
                    reconnectionAttempts: 3,
                    reconnectionDelay: 1000,
                });

                this.socket.on('connect', () => {
                    console.log("connected! ", this.socket?.id)
                    resolve(this.socket!);
                });

                this.socket.on('disconnect', (reason) => {
                    console.log('disconnected! ', reason);
                })

                this.socket.on('connect_error', (error) => {
                    console.log('connect error! ', error);
                })
            } catch (error) {
                reject(error);
            }
        });
    }

    startMonitoring(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                reject(new Error("Socket not connected"));
                return;
            }

            this.socket.emit('start_monitoring', { token });
            this.socket.once('monitoring started', (data) => {
                console.log("monitoring started! ", data.message);
                resolve();
            })

            this.socket.once("monitoring error", (error) => {
                console.log("monitoring error! ", error);
                reject(new Error(error.message));
            });
        });
    }

    stopMonitoring(): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit('stop_monitoring');
        }
    }

    onSystemStats(callback: (data: SystemStats) => void): void {
        if (this.socket) {
            this.socket.on("system_stats", callback);
        }
    }

    offSystemStats(): void {
        if (this.socket) {
            this.socket.off('system_stats');
        }
    }

    onMonitoringStop(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('monitoring stop', callback);
        }
    }

    disconnect(): void {
        if (this.socket) {
            this.stopMonitoring();
            this.socket.disconnect();
            this.socket = null;
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();