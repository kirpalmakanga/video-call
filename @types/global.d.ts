/// <reference types="vite/types/importMeta.d.ts" />

export {};

declare global {
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
    }

    interface Room {
        id: string;
        name: string;
        participants: Participant[];
    }

    type ClientRoom = Pick<Room, 'id' | 'name'> & { participantCount: number };
}
