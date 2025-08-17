import { onBeforeMount, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from './store/use-auth-store';

let socket: WebSocket;
let isConnected = false;

function getSocket() {
    if (!socket) {
        socket = new WebSocket(import.meta.env.VITE_SOCKET_URI as string);

        socket.addEventListener('open', () => {
            isConnected = true;
        });

        socket.addEventListener('error', async (event) => {
            console.log('socket:error', event);
            // if (err.message === 'unauthorized') {
            //     const accessToken = await refreshAccessToken();
            //     socket.auth = { token: accessToken };
            //     socket.connect();
            // }
        });
    }

    return socket;
}

function ensureConnection(): Promise<void> {
    return new Promise((resolve) =>
        setInterval(() => {
            if (isConnected) {
                resolve();
            }
        }, 100)
    );
}

export function useSocket() {
    const authStore = useAuthStore();
    const { refreshAccessToken } = authStore;
    const { accessToken } = storeToRefs(authStore);

    const subscriptions = new Map<ServerToClientEventId, Function>();

    function handleSocketMessage({ data }: MessageEvent) {
        const { event, payload } = JSON.parse(data);

        subscriptions.get(event)?.(payload);
    }

    async function sendEvent(data: Record<string, unknown>) {
        /** TODO: add to queue if not connected and send on opening */
        await ensureConnection();

        getSocket().send(JSON.stringify(data));
    }

    function hasSubscription(event: ServerToClientEventId) {
        return subscriptions.has(event);
    }

    async function addSubscription<E extends ServerToClientEventId>(
        event: E,
        callback: ServerToClientEvents[E]
    ) {
        subscriptions.set(event, callback);
    }

    function removeSubscription(event: ServerToClientEventId) {
        if (hasSubscription(event)) {
            subscriptions.delete(event);
        } else {
            throw new Error(
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
            throw new Error('No current subscriptions.');
        }
    }

    function init() {
        getSocket().addEventListener('message', handleSocketMessage);
    }

    function cleanup() {
        getSocket().removeEventListener('message', handleSocketMessage);
    }

    onBeforeMount(init);

    onBeforeUnmount(() => {
        cleanup();

        clearSubscriptions();
    });

    return {
        emit<E extends ClientToServerEventId>(
            event: E,
            payload: Parameters<ClientToServerEvents[E]>[0]
        ) {
            sendEvent({ event, payload });
        },
        subscribe<E extends ServerToClientEventId>(
            event: E,
            callback: ServerToClientEvents[E]
        ) {
            if (hasSubscription(event)) {
                throw new Error(
                    `Subscription for event "${event}" already exists`
                );
            } else {
                addSubscription(event, callback);
            }
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
