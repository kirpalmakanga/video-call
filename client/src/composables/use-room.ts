import { reactive, ref, watch } from 'vue';

import { useRTCSession } from './use-rtc-session';
import { useSocket } from './use-socket';
import { mergeByKey, omit, update } from '../utils/helpers';
import { useMediaStream } from './use-media-stream';

export function useRoom(roomId: string) {
    const { emit, subscribe, unsubscribeAll } = useSocket();

    const {
        removeConnection,
        clearConnections,
        createOffer,
        createAnswer,
        processAnswer,
        bindStreamToConnection,
        bindStreamToAllConnections,
        removeStreamFromAllConnections,
        addIceCandidate,
        setupPeerConnection
    } = useRTCSession();

    const {
        stream,
        isVideoEnabled,
        isAudioEnabled,
        enableStream,
        disableStream,
        toggleVideo,
        toggleAudio
    } = useMediaStream();

    const localParticipant = reactive<ClientParticipant>({
        id: crypto.randomUUID(),
        name: '',
        stream: null,
        isMuted: false,
        isLocalParticipant: true
    });

    const participants = ref<ClientParticipant[]>([]);

    function removeParticipant(participantId: string) {
        participants.value = participants.value.filter(
            ({ id }) => id !== participantId
        );
    }

    function isRemoteParticipant({ id }: ClientParticipant) {
        return id !== localParticipant.id;
    }

    function updateParticipant(
        participantId: string,
        data: Partial<ClientParticipant>
    ) {
        participants.value = update(
            participants.value,
            ({ id }) => id === participantId,
            data
        );
    }

    function toggleMuteParticipant(participantId: string) {
        const participant = participants.value.find(
            ({ id }) => id === participantId
        );

        if (participant) {
            participant.isMuted = !participant.isMuted;
        }
    }

    function sendCandidate(
        senderParticipantId: string,
        targetParticipantId: string,
        candidate: RTCIceCandidateInit
    ) {
        emit('iceCandidate', {
            senderParticipantId,
            targetParticipantId,
            roomId,
            sdpMLineIndex: candidate.sdpMLineIndex,
            candidate: candidate.candidate
        });
    }

    function connectToParticipant(participantId: string) {
        if (localParticipant.stream) {
            setupPeerConnection(participantId, {
                onIceCandidate(candidate) {
                    sendCandidate(
                        localParticipant.id,
                        participantId,
                        candidate
                    );
                },
                onStreamAvailable(stream) {
                    updateParticipant(participantId, { stream });
                },
                onDisconnection() {
                    removeParticipant(participantId);
                }
            });

            bindStreamToConnection(participantId, localParticipant.stream);
        }
    }

    function sendLocalParticipant() {
        emit('updateParticipant', {
            roomId,
            senderParticipantId: localParticipant.id,
            data: omit(localParticipant, 'stream', 'isLocalParticipant')
        });
    }

    async function connect({
        displayName,
        streamOptions
    }: {
        displayName: string;
        streamOptions: MediaStreamConstraints;
    }) {
        await enableStream(streamOptions);

        localParticipant.name = displayName;
        localParticipant.stream = stream.value;

        emit('joinRoom', {
            roomId,
            participant: omit(localParticipant, 'stream', 'isLocalParticipant')
        });
    }

    function disconnect() {
        unsubscribeAll();

        clearConnections();

        disableStream();

        participants.value = [];

        emit('leaveRoom', {
            roomId,
            participantId: localParticipant.id
        });
    }

    subscribe('incomingCall', async ({ roomId, senderParticipantId }) => {
        connectToParticipant(senderParticipantId);

        emit('offer', {
            roomId,
            senderParticipantId: localParticipant.id,
            targetParticipantId: senderParticipantId,
            offer: await createOffer(senderParticipantId)
        });
    });

    subscribe(
        'incomingOffer',
        async ({ roomId, senderParticipantId, offer }) => {
            connectToParticipant(senderParticipantId);

            emit('answer', {
                roomId,
                senderParticipantId: localParticipant.id,
                targetParticipantId: senderParticipantId,
                answer: await createAnswer(senderParticipantId, offer)
            });
        }
    );

    subscribe('incomingAnswer', ({ senderParticipantId, answer }) => {
        processAnswer(senderParticipantId, answer);
    });

    subscribe(
        'incomingIceCandidate',
        ({ senderParticipantId, sdpMLineIndex, candidate }) => {
            addIceCandidate(senderParticipantId, sdpMLineIndex, candidate);
        }
    );

    subscribe(
        'participantsListUpdated',
        ({ participants: updatedParticipantsList }) => {
            participants.value = mergeByKey(
                participants.value,
                updatedParticipantsList.filter(isRemoteParticipant),
                'id'
            );
        }
    );

    subscribe('participantDisconnected', ({ participantId }) => {
        removeConnection(participantId);

        removeParticipant(participantId);
    });

    watch(isAudioEnabled, () => {
        localParticipant.isMuted = !isAudioEnabled.value;

        sendLocalParticipant();
    });

    watch(
        () => localParticipant.name,
        () => {
            sendLocalParticipant();
        }
    );

    watch(stream, (stream, previousStream) => {
        localParticipant.stream = stream;

        if (previousStream) {
            removeStreamFromAllConnections();
        }

        if (stream) {
            bindStreamToAllConnections(stream);
        }
    });

    watch(participants, () => {
        if (participants.value.length === 0) {
            clearConnections();
        }
    });

    return {
        localParticipant,
        participants,
        isVideoEnabled,
        isAudioEnabled,
        toggleVideo,
        toggleAudio,
        toggleMuteParticipant,
        connect,
        disconnect
    };
}
