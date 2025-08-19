export class Socket {
    url: string;
    socket: WebSocket | null = null;
    maxReconnectionAttempts: number = 10;
    attempt: number = 0;
    listeners: Map<string, Set<Function>> = new Map();

    constructor(url: string) {
        this.url = url;

        this.connect();
    }

    getBackoffDelay(attempt: number) {
        const base = 500; // 0.5 second
        const max = 30000; // 30 seconds
        const jitter = Math.random() * 1000;
        return Math.min(base * 2 ** attempt + jitter, max);
    }

    hasListeners(event: string) {
        return !!this.listeners.get(event)?.size;
    }

    getListeners(event: string) {
        return this.listeners.get(event);
    }

    removeListener(event: string, callback: Function) {
        this.listeners.get(event)?.delete(callback);

        console.log(this.listeners.get(event)?.values());
    }

    clearListeners(event: string) {
        this.listeners.get(event)?.clear();

        this.listeners.delete(event);
    }

    connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.attempt = 0;

            this.socket?.send('ping');
        };

        this.socket.onmessage = ({ data }) => {
            try {
                if (data === 'pong') {
                    setTimeout(() => this.socket?.send('ping'), 20000);
                }

                const { event, payload } = JSON.parse(data);

                const listeners = this.getListeners(event);

                if (listeners) {
                    for (const callback of listeners) {
                        callback(payload);
                    }
                }
            } catch (error) {}
        };

        this.socket.onclose = () => {
            console.warn('WebSocket closed. Reconnecting...');
            this.reconnect();
        };

        this.socket.onerror = (err) => {
            console.error('WebSocket error:', err);

            this.socket?.close();
        };
    }

    reconnect() {
        if (this.attempt >= this.maxReconnectionAttempts) {
            console.error('Max reconnection attempts reached.');
            return;
        }

        const delay = this.getBackoffDelay(this.attempt);
        console.log(`Reconnecting in ${delay}ms`);

        setTimeout(() => {
            this.attempt++;
            this.connect();
        }, delay);
    }

    on(event: string, callback: Function) {
        if (!this.listeners.get(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event)?.add(callback);
    }

    off(event: string, callback?: Function) {
        if (!this.hasListeners(event)) {
            console.error(`Event ${event} has no listeners`);

            return;
        }

        if (callback) {
            this.removeListener(event, callback);
        }

        if (!callback || !this.hasListeners(event)) {
            this.clearListeners(event);
        }
    }

    send(event: string, payload: unknown) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ event, payload }));
        } else {
            console.warn('WebSocket not connected');
        }
    }
}
