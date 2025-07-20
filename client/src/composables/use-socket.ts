import { io, Socket } from 'socket.io-client';

interface EmissionsPayloads {
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
    updateParticipant: {
        roomId: string;
        senderParticipantId: string;
        data: Omit<Partial<ClientParticipant>, 'stream'>;
    };
    requestRoomsList: null;
}

interface SubscriptionPayloads {
    participantConnected: {
        roomId: string;
        senderParticipantId: string;
    };
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
    participantsListUpdated: { participants: ClientParticipant[] };
    participantDisconnected: { participantId: string };
    roomsListSync: { items: ClientRoom[] };
}

let socket: Socket;

export function useSocket() {
    const subscriptions = new Map<string, (...args: any[]) => void>();

    function getSocket() {
        if (!socket) {
            socket = io(import.meta.env.VITE_API_URI);
        }

        return socket;
    }

    return {
        emit<E extends keyof EmissionsPayloads>(
            event: E,
            data: EmissionsPayloads[E]
        ) {
            getSocket().emit(event, data);
        },
        subscribe<E extends keyof SubscriptionPayloads>(
            event: E,
            callback: (payload: SubscriptionPayloads[E]) => void
        ) {
            const socket = getSocket();

            socket.on(event, callback);

            subscriptions.set(event, callback);

            return () => {
                socket.off(event, callback);

                subscriptions.delete(event);
            };
        },
        unsubscribe<E extends keyof SubscriptionPayloads>(
            event: E,
            callback: (payload: SubscriptionPayloads[E]) => void
        ) {
            getSocket().off(event, callback);
        },
        unsubscribeAll() {
            for (const [event, callback] of subscriptions) {
                socket.off(event, callback);
            }
        }
    };
}
