import { onBeforeMount, onBeforeUnmount, onUnmounted } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useAuthStore } from './store/use-auth-store';
import { Socket } from '../utils/socket';

export const useSocketInstance = defineStore('socket', () => {
    const authStore = useAuthStore();
    const { refreshAccessToken } = authStore;
    const { accessToken } = storeToRefs(authStore);

    let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
        null;
    let instancesCount: number = 0;

    function removeSocket() {
        console.log('removeSocket');
        socket?.close();

        socket = null;
        instancesCount = 0;
    }

    return {
        getSocket() {
            if (!socket) {
                socket = new Socket(`${import.meta.env.VITE_SOCKET_URI}/_ws`, {
                    auth: { token: accessToken.value }
                });

                socket.on('connectError', async (err) => {
                    if (err.message === 'unauthorized') {
                        await refreshAccessToken();

                        socket?.setAuth({ token: accessToken.value });

                        socket?.connect();
                    }
                });
            }

            return socket;
        },
        increaseInstancesCount() {
            instancesCount++;
        },
        decreaseInstancesCount() {
            if (instancesCount > 0) {
                instancesCount--;
            }

            if (socket && instancesCount === 0) {
                removeSocket();
            }
        },
        removeSocket
    };
});

export function useSocket() {
    const { getSocket, increaseInstancesCount, decreaseInstancesCount } =
        useSocketInstance();

    const subscriptions = new Map<ServerToClientEventId, Function>();

    function addSubscription(
        event: ServerToClientEventId,
        callback: ServerToClientEvents[ServerToClientEventId]
    ) {
        if (subscriptions.has(event)) {
            throw new Error(`Subscription for event "${event}" already exists`);
        } else {
            const socket = getSocket();

            socket.on(event, callback);

            subscriptions.set(event, () => socket.off(event, callback));
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
            getSocket().emit(event, payload);
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
