import { onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './store/use-auth-store';

let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
    const authStore = useAuthStore();
    const { refreshAccessToken } = authStore;
    const { accessToken } = storeToRefs(authStore);

    const subscriptions = new Map<ServerToClientEventId, Function>();

    function getSocket() {
        if (!socket) {
            socket = io(import.meta.env.VITE_API_URI, {
                reconnectionDelay: 5000,
                auth: { token: accessToken.value }
            });

            socket.on('connect_error', async (err) => {
                if (err.message === 'unauthorized') {
                    const accessToken = await refreshAccessToken();

                    socket.auth = { token: accessToken };

                    socket.connect();
                }
            });
        }

        return socket;
    }

    function removeSubscription(event: ServerToClientEventId) {
        const unsubscribe = subscriptions.get(event);

        if (unsubscribe) {
            unsubscribe();

            subscriptions.delete(event);
        } else {
            throw new Error(
                `Subscription for event "${event}" does not exist or has already been removed.`
            );
        }
    }

    function removeAllSubscriptions() {
        if (subscriptions.size) {
            for (const [_, unsubscribe] of subscriptions) {
                unsubscribe();
            }

            subscriptions.clear();
        } else {
            throw new Error('No current subscriptions.');
        }
    }

    onBeforeUnmount(removeAllSubscriptions);

    return {
        emit<E extends ClientToServerEventId>(
            event: E,
            ...data: Parameters<ClientToServerEvents[E]>
        ) {
            getSocket().emit(event, ...data);
        },
        subscribe<E extends ServerToClientEventId>(
            event: E,
            callback: ServerToClientEvents[E]
        ) {
            if (subscriptions.has(event)) {
                throw new Error(
                    `Subscription for event "${event}" already exists`
                );
            } else {
                const socket = getSocket();

                socket.on(event, callback);

                subscriptions.set(event, () => socket.off(event, callback));
            }
        },
        unsubscribe(event?: ServerToClientEventId) {
            if (event) {
                removeSubscription(event);
            } else {
                removeAllSubscriptions();
            }
        }
    };
}
