/// <reference types="vite/types/importMeta.d.ts" />

export {};

declare global {
    interface User {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    }

    interface RTCSessionDescriptionInit {
        sdp: string;
        type: string;
    }
    interface Participant {
        id: string;
        name: string;
        isCameraDisabled: boolean;
        isMuted: boolean;
    }

    interface ClientParticipant extends Participant {
        stream?: MediaStream;
        isLocalParticipant?: boolean;
        isLocallyMuted?: boolean;
    }

    interface Room {
        id: string;
        name: string;
        isOwned?: boolean;
        isFavorite: boolean;
        creator?: {
            id: string;
            firstName: string;
            lastName: string;
        };
    }

    interface RoomFormData {
        name: string;
    }

    /** Socket: */
    interface BaseEventPayload {
        roomId: string;
        participantId: string;
    }

    interface ServerWebsocketEvents {
        requestConnection: (payload: BaseEventPayload) => void;
        connectParticipant: (payload: BaseEventPayload) => void;
        disconnectParticipant: (payload: BaseEventPayload) => void;
        offer: (
            payload: BaseEventPayload & {
                targetParticipantId: string;
                offer: RTCSessionDescriptionInit;
            }
        ) => void;
        answer: (
            payload: BaseEventPayload & {
                targetParticipantId: string;
                answer: RTCSessionDescriptionInit;
            }
        ) => void;
        iceCandidate: (
            payload: BaseEventPayload & {
                targetParticipantId: string;
                iceCandidate: RTCIceCandidate;
            }
        ) => void;
        syncParticipant: (payload: { roomId: string; participant: Participant }) => void;
    }

    type ClientToServerEventId = keyof ServerWebsocketEvents;

    type ClientToServerEventPayload<K extends ClientToServerEventId> = Parameters<
        ServerWebsocketEvents[K]
    >[0];

    interface ClientWebsocketEvents {
        connected: () => void;
        disconnected: () => void;
        participantSynced: (payload: ClientParticipant) => void;
        connectionConfirmed: (payload: { participantId: string }) => void;
        participantConnected: (payload: { participantId: string }) => void;
        participantDisconnected: (payload: { participantId: string }) => void;
        incomingOffer: (payload: {
            senderParticipantId: string;
            offer: RTCSessionDescriptionInit;
        }) => void;
        incomingAnswer: (payload: {
            senderParticipantId: string;
            answer: RTCSessionDescriptionInit;
        }) => void;
        incomingIceCandidate: (payload: {
            senderParticipantId: string;
            iceCandidate: RTCIceCandidate;
        }) => void;
    }

    type ServerToClientEventId = keyof ClientWebsocketEvents;

    type ServerToClientEventPayload<K extends ServerToClientEventId> = Parameters<
        ClientWebsocketEvents[K]
    >[0];
}
