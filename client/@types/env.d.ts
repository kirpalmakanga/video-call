/// <reference types="vite/client" />
interface ImportMeta {
    readonly env: {
        VITE_API_URI: string;
        VITE_SOCKET_URI: string;
        VITE_STUN_SERVERS: string;
    };
}
