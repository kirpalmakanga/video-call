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

    interface User {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    }

    interface RTCSessionDescriptionInit {
        sdp: string;
        type: string;
    }
    interface Participant {
        id: string;
        name: string;
        isMuted?: boolean;
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
    interface ClientToServerEvents {
        requestConnection: (payload: {
            roomId: string;
            participantId: string;
        }) => void;
        connectParticipant: (payload: {
            roomId: string;
            participantId: string;
        }) => void;
        disconnectParticipant: (payload: {
            roomId: string;
            participantId: string;
        }) => void;
        offer: (payload: {
            roomId: string;
            participantId: string;
            targetParticipantId: string;
            offer: RTCSessionDescriptionInit;
        }) => void;
        answer: (payload: {
            roomId: string;
            participantId: string;
            targetParticipantId: string;
            answer: RTCSessionDescriptionInit;
        }) => void;
        iceCandidate: (payload: {
            roomId: string;
            participantId: string;
            targetParticipantId: string;
            iceCandidate: RTCIceCandidate;
        }) => void;
        syncParticipant: (payload: {
            roomId: string;
            participant: Participant;
        }) => void;
    }

    type ClientToServerEventId = keyof ClientToServerEvents;

    type ClientToServerEventPayload<K extends ClientToServerEventId> =
        Parameters<ClientToServerEvents[K]>[0];

    interface ServerToClientEvents {
        connect: () => void;
        disconnect: () => void;
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

    type ServerToClientEventId = keyof ServerToClientEvents;

    type ServerToClientEventPayload<K extends ServerToClientEventId> =
        Parameters<ServerToClientEvents[K]>[0];
}
