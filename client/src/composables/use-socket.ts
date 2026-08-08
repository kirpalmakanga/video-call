import { computed, onBeforeUnmount, watch } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useWebSocket } from '@vueuse/core';
import { useAuthStore } from './store/use-auth-store';
import { useOnline } from '@vueuse/core';

const { VITE_SOCKET_URI } = import.meta.env;

const HEARTBEAT_MESSAGE = '';

export const useSocketStore = defineStore('socket', () => {
    const authStore = useAuthStore();
    const { refreshAccessToken } = authStore;
    const { accessToken } = storeToRefs(authStore);

    const isOnline = useOnline();

    const listeners: Map<string, Set<Function>> = new Map();

    const socketUrl = computed(() => `${VITE_SOCKET_URI}?token=${accessToken.value}`);

    const { ws, send, open, close } = useWebSocket(socketUrl, {
        immediate: false,
        autoConnect: false,
        autoReconnect: { retries: 5 },
        heartbeat: { message: HEARTBEAT_MESSAGE, interval: 20000 },
        onConnected: () => triggerHandlers('connected'),
        onDisconnected: () => triggerHandlers('disconnected'),
        onMessage: async (_, { data }: MessageEvent) => {
            if (data === HEARTBEAT_MESSAGE) return;

            let message = null;

            try {
                message = JSON.parse(data);
            } catch (error) {
                console.error('Failed to parse message:', data, error);
            }

            if (message) await handleMessage(message);
        }
    });

    async function handleMessage({ event, payload }: { event: string; payload: unknown }) {
        if (event === 'unauthorized') {
            close();

            await refreshAccessToken();
        } else {
            triggerHandlers(event, payload);
        }
    }

    function removeHandler(event: string, handler: Function) {
        listeners.get(event)?.delete(handler);

        if (listeners.get(event)?.size === 0) {
            listeners.delete(event);
        } else {
            console.warn(
                `Handler for event "${event}" does not exist or has already been removed.`
            );
        }
    }

    function removeAllHandlers(event: string) {
        if (listeners.has(event)) {
            listeners.delete(event);
        } else {
            console.warn(`No handlers found for event "${event}" or already removed.`);
        }
    }

    function triggerHandlers(event: string, payload?: unknown) {
        const handlers = listeners.get(event);

        if (handlers && handlers.size > 0) {
            for (const handler of handlers) {
                handler(payload);
            }
        }
    }

    watch([isOnline, socketUrl], () => isOnline.value && open());

    watch(accessToken, () => !accessToken.value && close());

    function off(event: string, handler?: Function) {
        if (handler) {
            removeHandler(event, handler);
        } else {
            removeAllHandlers(event);
        }

        if (listeners.size === 0 && ws.value) {
            close();
        }
    }

    return {
        off,
        on(event: string, handler: Function) {
            if (listeners.size === 0 && !ws.value) {
                open();
            }

            if (!listeners.has(event)) listeners.set(event, new Set());

            listeners.get(event)?.add(handler);

            return () => off(event, handler);
        },
        send(event: string, payload: unknown) {
            send(JSON.stringify({ event, payload }));
        }
    };
});

export function useSocket() {
    const { on, send } = useSocketStore();

    const subscriptions = new Map<ServerToClientEventId, Function>();

    function removeSubscription(event: ServerToClientEventId) {
        const unsubscribe = subscriptions.get(event);

        if (unsubscribe) {
            unsubscribe();

            subscriptions.delete(event);
        } else {
            console.warn(
                `Subscription for event "${event}" does not exist or has already been removed.`
            );
        }
    }

    function clearSubscriptions() {
        if (subscriptions.size) {
            for (const [_, unsubscribe] of subscriptions) {
                unsubscribe();
            }

            subscriptions.clear();
        } else {
            console.warn('No current subscriptions.');
        }
    }

    onBeforeUnmount(clearSubscriptions);

    return {
        emit: <E extends ClientToServerEventId>(
            event: E,
            payload: ClientToServerEventPayload<E>
        ) => {
            send(event, payload);
        },
        subscribe: <E extends ServerToClientEventId>(
            event: E,
            callback: ClientWebsocketEvents[E]
        ) => {
            if (subscriptions.has(event)) {
                console.warn(`Subscription for event "${event}" already exists`);
            } else {
                subscriptions.set(
                    event,
                    on(event, (payload: any) => callback(payload))
                );
            }
        },
        unsubscribe: (event?: ServerToClientEventId) => {
            if (event) {
                removeSubscription(event);
            } else {
                clearSubscriptions();
            }
        }
    };
}
