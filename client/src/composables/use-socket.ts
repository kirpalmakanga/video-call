import { io } from 'socket.io-client';

interface EmittedEventsPayloads {
    call: {
        roomId: string;
        participant: Participant;
    };
    leaveRoom: {
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
}

interface ListenedEventPayloads {
    incomingCall: {
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
