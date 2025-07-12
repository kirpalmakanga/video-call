import { io } from 'socket.io-client';

interface CommonEvents {
    call: {
        roomId: string;
        senderUserId: string;
    };
    offer: {
        roomId: string;
        senderUserId: string;
        receiverUserId: string;
        offer: RTCSessionDescriptionInit;
    };
    answer: {
        roomId: string;
        senderUserId: string;
        receiverUserId: string;
        answer: RTCSessionDescriptionInit;
    };
}

interface EmittedEventsPayloads extends CommonEvents {
    join: { roomId: string; user: User };
    leave: {
        roomId: string;
        userId: string;
    };
    iceCandidate: {
        senderUserId: string;
        remotePeerId: string;
        roomId: string;
        sdpMLineIndex: number | null | undefined;
        candidate: string | undefined;
    };
    toggleMicrophone: {
        roomId: string;
        senderUserId: string;
        isMuted: boolean;
    };
}

interface ListenedEventPayloads extends CommonEvents {
    iceCandidate: {
        remotePeerId: string;
        sdpMLineIndex: number;
        candidate: string;
    };
    toggleMicrophone: { senderUserId: string; isMuted: boolean };
    usersListUpdated: { users: ClientUser[] };
    userDisconnected: { userId: string };
}

export function useSocket() {
    const socket = io('https://api.video-call.dev');

    return {
        emit<E extends keyof EmittedEventsPayloads>(
            event: E,
            data: EmittedEventsPayloads[E]
        ) {
            socket.emit(event, data);
        },
        listen<E extends keyof ListenedEventPayloads>(
            event: E,
            callback: (payload: ListenedEventPayloads[E]) => void
        ) {
            socket.on(event, callback);
        }
    };
}
