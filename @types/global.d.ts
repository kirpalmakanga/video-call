/// <reference types="vite/types/importMeta.d.ts" />

export {};

declare global {
    interface LoginFormData {
        email: string;
        password: string;
    }

    interface RegisterFormData extends LoginFormData {
        firstName: string;
        lastName: string;
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
        participants: Participant[];
    }

    type ClientRoom = Pick<Room, 'id' | 'name'> & { participantCount: number };
}
