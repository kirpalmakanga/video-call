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

    interface Device {
        id: string;
        label: string;
    }

    interface ClientParticipant extends Participant {
        stream: MediaStream | null;
        isLocalUser?: boolean;
    }
}
