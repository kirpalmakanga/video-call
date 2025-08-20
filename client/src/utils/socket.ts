interface SocketOptions {
    maxReconnectionAttempts: number;
    maxEnqueuedMessages: number;
    auth: { token: string | null };
}

export class Socket {
    private _url: string;
    private _socket: WebSocket | null = null;
    private _isConnecting: boolean = false;
    private _attempt: number = 0;
    private _listeners: Map<string, Set<Function>> = new Map();
    private _messageQueue: unknown[] = [];
    private _options: SocketOptions = {
        maxReconnectionAttempts: 10,
        maxEnqueuedMessages: Infinity,
        auth: {
            token: null
        }
    };

    constructor(url: string, options?: Partial<SocketOptions>) {
        this._url = url;

        if (options) {
            Object.assign(this._options, options);
        }

        this._connect();
    }

    private _delay(t: number) {
        return new Promise((resolve) => setTimeout(resolve, t));
    }

    private _getBackoffDelay(attempt: number) {
        const base = 500; // 0.5 second
        const max = 30000; // 30 seconds
        const jitter = Math.random() * 1000;
        return Math.min(base * 2 ** attempt + jitter, max);
    }

    private _hasEventListeners(event: string) {
        return !!this._listeners.get(event)?.size;
    }

    private _getEventListeners(event: string) {
        return this._listeners.get(event);
    }

    private _clearEventListeners(event: string) {
        this._listeners.get(event)?.clear();

        this._listeners.delete(event);
    }

    private _addEventListener(event: string, callback: Function) {
        if (!this._hasEventListeners(event)) {
            this._listeners.set(event, new Set());
        }

        this._listeners.get(event)?.add(callback);
    }

    private _removeEventListener(event: string, callback: Function) {
        this._listeners.get(event)?.delete(callback);

        if (!this._hasEventListeners(event)) {
            this._clearEventListeners(event);
        }
    }

    private _triggerListeners(event: string, payload: unknown) {
        if (this._hasEventListeners(event)) {
            const listeners = this._getEventListeners(event);

            if (listeners?.size) {
                for (const callback of listeners) {
                    callback(payload);
                }
            }
        }
    }

    private _clearListeners() {
        if (this._socket) {
            this._socket.onopen = null;
            this._socket.onmessage = null;
            this._socket.onclose = null;
            this._socket.onerror = null;
            this._listeners.clear();
        }
    }

    private _sendMessage(message: unknown) {
        this._socket?.send(JSON.stringify(message));
    }

    private _sendMessageQueue() {
        if (this._messageQueue.length) {
            for (const data of this._messageQueue) {
                this._sendMessage(data);
            }

            this._messageQueue = [];
        }
    }

    private _onConnectionOpened = (openEvent: Event) => {
        this._isConnecting = false;

        this._attempt = 0;

        this._socket?.send('ping');

        this._sendMessageQueue();

        this._triggerListeners('open', openEvent);
    };

    private _onMessageReceived = async ({ data }: MessageEvent) => {
        try {
            if (data === 'pong') {
                await this._delay(20000);

                this._socket?.send('ping'), 20000;

                return;
            }

            const { event, payload } = JSON.parse(data);

            this._triggerListeners(event, payload);
        } catch (error) {
            console.error(error);
        }
    };

    private _onConnectionClosed = (closeEvent: Event) => {
        console.warn('WebSocket closed. Reconnecting...');

        this._triggerListeners('close', closeEvent);

        this.reconnect();
    };

    private _onConnectionError = (errorEvent: Event) => {
        console.error('WebSocket error:', errorEvent);

        this._triggerListeners('error', errorEvent);

        this._socket?.close();
    };

    private _getSocketUrl() {
        let url = this._url;

        if (this._options.auth.token) {
            return url.concat(`?token=${this._options.auth.token}`);
        }

        return url;
    }

    private _connect() {
        if (this._isConnecting) {
            console.error('WebSocket is already connecting');
            return;
        }

        this._isConnecting = true;

        this._socket = new WebSocket(this._getSocketUrl());

        this._socket.onopen = this._onConnectionOpened;
        this._socket.onmessage = this._onMessageReceived;
        this._socket.onclose = this._onConnectionClosed;
        this._socket.onerror = this._onConnectionError;
    }

    public setAuth(auth: Partial<SocketOptions['auth']>) {
        Object.assign(this._options.auth, auth);
    }

    public async reconnect() {
        if (this._attempt >= this._options.maxReconnectionAttempts) {
            console.error('Max reconnection attempts reached.');
            return;
        }

        const backoffDelay = this._getBackoffDelay(this._attempt);
        console.log(`Reconnecting in ${backoffDelay}ms`);

        await this._delay(backoffDelay);

        this._attempt++;
        this._connect();
    }

    public close() {
        if (!this._socket) {
            console.log('WebSocket close enqueued: no ws instance');
            return;
        }
        if (this._socket.readyState === WebSocket.CLOSED) {
            console.log('WebSocket close: already closed');
            return;
        }

        this._clearListeners();

        this._socket.close();
    }

    public on(event: string, callback: Function) {
        this._addEventListener(event, callback);
    }

    public off(event: string, callback?: Function) {
        if (!this._hasEventListeners(event)) {
            console.error(`Event ${event} has no listeners`);

            return;
        }

        if (callback) {
            this._removeEventListener(event, callback);
        } else {
            this._clearEventListeners(event);
        }
    }

    public emit(event: string, payload: unknown) {
        if (this._socket?.readyState === WebSocket.OPEN) {
            this._sendMessage({ event, payload });
        } else if (
            this._messageQueue.length < this._options.maxEnqueuedMessages
        ) {
            this._messageQueue.push({ event, payload });
        }
    }
}
