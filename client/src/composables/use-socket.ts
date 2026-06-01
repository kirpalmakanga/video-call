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

    const socketUrl = computed(() => `${VITE_SOCKET_URI}?token=${accessToken.value}`);

    const { ws, send, open, close } = useWebSocket(socketUrl, {
        immediate: false,
        autoConnect: false,
        heartbeat: { message: HEARTBEAT_MESSAGE, interval: 20000 }
    });

    const isOnline = useOnline();

    const listeners: Map<string, Set<Function>> = new Map();

    async function handleMessage({ data }: MessageEvent) {
        if (data === HEARTBEAT_MESSAGE) return;

        const { event, payload } = JSON.parse(data);

        if (event === 'connectError' && payload.message === 'unauthorized') {
            close();

            await refreshAccessToken();

            open();

            return;
        }

        triggerHanglers(event, payload);
    }

    function closeSocket() {
        ws.value?.removeEventListener('message', handleMessage);

        close();
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

    function triggerHanglers(event: string, payload: unknown) {
        const handlers = listeners.get(event);

        if (handlers && handlers.size > 0) {
            for (const handler of handlers) {
                handler(payload);
            }
        } else {
            console.warn(`No handlers found for event "${event}"`);
        }
    }

    function handleSocketChange() {
        if (ws.value) {
            ws.value.addEventListener('message', handleMessage);
        }
    }

    watch(ws, handleSocketChange, { immediate: true });

    watch(isOnline, () => isOnline.value && open());

    return {
        closeSocket,
        on(event: string, handler: Function) {
            if (listeners.size === 0 && !ws.value) {
                open();
            }

            if (!listeners.has(event)) listeners.set(event, new Set());

            listeners.get(event)?.add(handler);
        },
        off(event: string, handler?: Function) {
            if (handler) {
                removeHandler(event, handler);
            } else {
                removeAllHandlers(event);
            }

            if (listeners.size === 0 && ws.value) {
                closeSocket();
            }
        },
        send(event: string, payload: unknown) {
            send(JSON.stringify({ event, payload }));
        }
    };
});

export function useSocket() {
    const { on, off, send } = useSocketStore();

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
            callback: ServerToClientEvents[E]
        ) => {
            if (subscriptions.has(event)) {
                console.warn(`Subscription for event "${event}" already exists`);
            } else {
                on(event, callback);

                subscriptions.set(event, () => off(event, callback));
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
