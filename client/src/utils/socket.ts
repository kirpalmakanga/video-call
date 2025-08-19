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

    delay(t: number) {
        return new Promise((resolve) => setTimeout(resolve, t));
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

    clearListeners(event: string) {
        this.listeners.get(event)?.clear();

        this.listeners.delete(event);
    }

    addListener(event: string, callback: Function) {
        if (!this.hasListeners(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event)?.add(callback);
    }

    removeListener(event: string, callback: Function) {
        this.listeners.get(event)?.delete(callback);

        if (!this.hasListeners(event)) {
            this.clearListeners(event);
        }
    }

    connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            this.attempt = 0;

            this.socket?.send('ping');
        };

        this.socket.onmessage = async ({ data }) => {
            try {
                if (data === 'pong') {
                    await this.delay(20000);

                    this.socket?.send('ping'), 20000;

                    return;
                }

                const { event, payload } = JSON.parse(data);

                const listeners = this.getListeners(event);

                if (listeners?.size) {
                    for (const callback of listeners) {
                        callback(payload);
                    }
                }
            } catch (error) {
                console.error(error);
            }
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
        this.addListener(event, callback);
    }

    off(event: string, callback?: Function) {
        if (!this.hasListeners(event)) {
            console.error(`Event ${event} has no listeners`);

            return;
        }

        if (callback) {
            this.removeListener(event, callback);
        } else {
            this.clearListeners(event);
        }
    }

    emit(event: string, payload: unknown) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ event, payload }));
        } else {
            console.warn('WebSocket not connected');
        }
    }
}
