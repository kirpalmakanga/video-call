import { onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './store/use-auth-store';

export interface EmissionsPayloads {
    connectParticipant: {
        roomId: string;
        participant: Participant;
    };
    disconnectParticipant: {
        roomId: string;
        participantId: string;
    };
    offer: {
        roomId: string;
        senderParticipantId: string;
        targetParticipantId: string;
        offer: RTCSessionDescriptionInit;
    };
    answer: {
        roomId: string;
        senderParticipantId: string;
        targetParticipantId: string;
        answer: RTCSessionDescriptionInit;
    };
    iceCandidate: {
        senderParticipantId: string;
        targetParticipantId: string;
        roomId: string;
        sdpMLineIndex: number | null | undefined;
        candidate: string | undefined;
    };
    toggleMicrophone: {
        roomId: string;
        senderParticipantId: string;
        isMuted: boolean;
    };
    syncParticipant: {
        roomId: string;
        participant: Omit<Partial<ClientParticipant>, 'stream'>;
    };
    joinUserCounts: never;
    leaveUserCounts: never;
}

type EmittedEvent = keyof EmissionsPayloads;

export interface SubscriptionPayloads {
    disconnect: never;
    connect: never;
    participantSynced: { participant: ClientParticipant };
    participantConnected: {
        participantId: string;
    };
    participantDisconnected: { participantId: string };
    connectedToRoom: never;
    incomingOffer: {
        roomId: string;
        senderParticipantId: string;
        targetParticipantId: string;
        offer: RTCSessionDescriptionInit;
    };
    incomingAnswer: {
        roomId: string;
        senderParticipantId: string;
        targetParticipantId: string;
        answer: RTCSessionDescriptionInit;
    };
    incomingIceCandidate: {
        senderParticipantId: string;
        sdpMLineIndex: number;
        candidate: string;
    };
}

type SubscriptionEvent = keyof SubscriptionPayloads;

let socket: Socket;

export function useSocket() {
    const authStore = useAuthStore();
    const { refreshAccessToken } = authStore;
    const { accessToken } = storeToRefs(authStore);

    const subscriptions = new Map<SubscriptionEvent, Function>();

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

    function removeSubscription(event: SubscriptionEvent) {
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
        reconnect() {
            const socket = getSocket();

            if (socket.disconnected) {
                socket.connect();
            }
        },
        emit<E extends EmittedEvent>(event: E, data?: EmissionsPayloads[E]) {
            getSocket().emit(event, data);
        },
        subscribe<E extends SubscriptionEvent>(
            event: E,
            callback: (payload: SubscriptionPayloads[E]) => void
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
        unsubscribe(event?: SubscriptionEvent) {
            if (event) {
                removeSubscription(event);
            } else {
                removeAllSubscriptions();
            }
        }
    };
}
