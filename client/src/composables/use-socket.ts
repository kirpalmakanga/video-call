import {
    computed,
    onBeforeMount,
    onBeforeUnmount,
    onUnmounted,
    ref,
    watch
} from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useAuthStore } from './store/use-auth-store';
import { useWebSocket } from '@vueuse/core';

const { VITE_SOCKET_URI } = import.meta.env;

const HEARTBEAT_MESSAGE = '';

export const useSocketStore = defineStore('socket', () => {
    const authStore = useAuthStore();
    const { refreshAccessToken } = authStore;
    const { accessToken } = storeToRefs(authStore);

    const socketUrl = computed(
        () => `${VITE_SOCKET_URI}/_ws?token=${accessToken.value}`
    );

    const { ws, send, open, close } = useWebSocket(socketUrl, {
        immediate: false,
        autoConnect: false,
        heartbeat: { message: HEARTBEAT_MESSAGE, interval: 20000 }
    });

    const listeners: Map<string, Set<Function>> = new Map();

    let instancesCount: number = 0;

    function removeSocket() {
        console.log('close');
        close();

        instancesCount = 0;
    }

    async function handleMessage({ data }: MessageEvent) {
        if (data === HEARTBEAT_MESSAGE) return;

        const { event, payload } = JSON.parse(data);

        if (event === 'connectError' && payload.message === 'unauthorized') {
            close();

            await refreshAccessToken();

            open();

            return;
        }

        const handlers = listeners.get(event);

        if (handlers) {
            for (const handler of handlers) {
                handler(payload);
            }
        }
    }

    function handleSocketChange() {
        if (ws.value) {
            ws.value.addEventListener('message', handleMessage);
        }
    }

    watch(ws, handleSocketChange, { immediate: true });

    return {
        on(event: string, handler: Function) {
            if (!listeners.has(event)) listeners.set(event, new Set());

            listeners.get(event)?.add(handler);
        },
        off(event: string, handler?: Function) {
            if (handler) {
                listeners.get(event)?.delete(handler);
            } else if (event) {
                listeners.delete(event);
            }
        },
        send(event: string, payload: Record<string, unknown>) {
            send(JSON.stringify({ event, payload }));
        },
        increaseInstancesCount() {
            if (instancesCount === 0) {
                console.log('open');
                open();
            }

            instancesCount++;
        },
        decreaseInstancesCount() {
            if (instancesCount > 0) {
                instancesCount--;
            }

            if (ws.value && instancesCount === 0) {
                removeSocket();
            }
        },
        removeSocket
    };
});

export function useSocket() {
    const { on, off, send, increaseInstancesCount, decreaseInstancesCount } =
        useSocketStore();

    const subscriptions = new Map<ServerToClientEventId, Function>();

    function addSubscription(
        event: ServerToClientEventId,
        callback: ServerToClientEvents[ServerToClientEventId]
    ) {
        if (subscriptions.has(event)) {
            throw new Error(`Subscription for event "${event}" already exists`);
        } else {
            on(event, callback);

            subscriptions.set(event, () => off(event, callback));
        }
    }

    function removeSubscription(event: ServerToClientEventId) {
        const unsubscribe = subscriptions.get(event);

        if (unsubscribe) {
            unsubscribe();

            subscriptions.delete(event);
        } else {
            console.error(
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
            console.error('No current subscriptions.');
        }
    }

    onBeforeMount(increaseInstancesCount);

    onBeforeUnmount(clearSubscriptions);

    onUnmounted(decreaseInstancesCount);

    return {
        emit<E extends ClientToServerEventId>(
            event: E,
            payload: ClientToServerEventPayload<E>
        ) {
            send(event, payload);
        },
        subscribe<E extends ServerToClientEventId>(
            event: E,
            callback: ServerToClientEvents[E]
        ) {
            addSubscription(event, callback);
        },
        unsubscribe(event?: ServerToClientEventId) {
            if (event) {
                removeSubscription(event);
            } else {
                clearSubscriptions();
            }
        }
    };
}
