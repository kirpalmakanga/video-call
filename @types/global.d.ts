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
        creatorId: string;
        createdAt: Date;
        updatedAt: Date;
    }

    interface RoomFormData {
        name: string;
    }

    /** Socket: */
    interface ClientToServerEvents {
        disconnect: () => void;
        connectParticipant: (payload: {
            roomId: string;
            participant: Participant;
        }) => void;
        disconnectParticipant: (payload: {
            roomId: string;
            participantId: string;
        }) => void;
        offer: (payload: {
            roomId: string;
            senderParticipantId: string;
            targetParticipantId: string;
            offer: RTCSessionDescriptionInit;
        }) => void;
        answer: (payload: {
            roomId: string;
            senderParticipantId: string;
            targetParticipantId: string;
            answer: RTCSessionDescriptionInit;
        }) => void;
        iceCandidate: (payload: {
            roomId: string;
            senderParticipantId: string;
            targetParticipantId: string;
            sdpMLineIndex: number | null | undefined;
            candidate: string | undefined;
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
        disconnect: () => void;
        connect: () => void;
        unauthorized: () => void;
        participantSynced: (payload: ClientParticipant) => void;
        participantConnected: (payload: { participantId: string }) => void;
        participantDisconnected: (payload: { participantId: string }) => void;
        connectedToRoom: () => void;
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
            sdpMLineIndex: number | null | undefined;
            candidate: string | undefined;
        }) => void;
    }

    type ServerToClientEventId = keyof ServerToClientEvents;

    type ServerToClientEventPayload<K extends ServerToClientEventId> =
        Parameters<ServerToClientEvents[K]>[0];
}
