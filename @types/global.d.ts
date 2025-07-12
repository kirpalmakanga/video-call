export {};

declare global {
    interface RTCSessionDescriptionInit {
        sdp: string;
        type: string;
    }
    interface User {
        id: string;
        name: string;
        isMuted?: boolean;
    }

    interface Device {
        id: string;
        label: string;
    }

    interface ClientUser {
        id: string;
        name: string;
        stream: MediaStream | null;
        isLocalUser?: boolean;
        isMuted: boolean;
    }
}
