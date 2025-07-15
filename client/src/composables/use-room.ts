import { ref, watch, type Ref } from 'vue';

import { useRTCSession } from './use-rtc-session';
import { useSocket } from './use-socket';
import { mergeByKey, omit, update } from '../utils/helpers';

interface RoomConfig {
    roomId: string;
    localParticipantRef: Ref<ClientParticipant>;
    streamRef: Ref<MediaStream | null>;
}

export function useRoom({
    roomId,
    localParticipantRef,
    streamRef
}: RoomConfig) {
    const { emit, listen } = useSocket();

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

    const participants = ref<ClientParticipant[]>([]);

    function removeParticipant(participantId: string) {
        participants.value = participants.value.filter(
            ({ id }) => id !== participantId
        );
    }

    function isRemoteParticipant({ id }: ClientParticipant) {
        return id !== localParticipantRef.value.id;
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
        if (streamRef.value) {
            setupPeerConnection(participantId, {
                onIceCandidate(candidate) {
                    sendCandidate(
                        localParticipantRef.value.id,
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

            bindStreamToConnection(participantId, streamRef.value);
        }
    }

    async function startCall() {
        emit('call', {
            roomId,
            participant: omit(localParticipantRef.value, 'stream')
        });
    }

    function stopCall() {
        emit('leaveRoom', {
            roomId,
            participantId: localParticipantRef.value.id
        });

        clearConnections();
    }

    listen('incomingCall', async ({ roomId, senderParticipantId }) => {
        connectToParticipant(senderParticipantId);

        emit('offer', {
            roomId,
            senderParticipantId: localParticipantRef.value.id,
            targetParticipantId: senderParticipantId,
            offer: await createOffer(senderParticipantId)
        });
    });

    listen('incomingOffer', async ({ roomId, senderParticipantId, offer }) => {
        connectToParticipant(senderParticipantId);

        emit('answer', {
            roomId,
            senderParticipantId: localParticipantRef.value.id,
            targetParticipantId: senderParticipantId,
            answer: await createAnswer(senderParticipantId, offer)
        });
    });

    listen('incomingAnswer', ({ senderParticipantId, answer }) => {
        processAnswer(senderParticipantId, answer);
    });

    listen(
        'incomingIceCandidate',
        ({ senderParticipantId, sdpMLineIndex, candidate }) => {
            addIceCandidate(senderParticipantId, sdpMLineIndex, candidate);
        }
    );

    listen(
        'participantsListUpdated',
        ({ participants: updatedParticipantsList }) => {
            participants.value = mergeByKey(
                participants.value,
                updatedParticipantsList.filter(isRemoteParticipant),
                'id'
            );
        }
    );

    listen('participantDisconnected', ({ participantId }) => {
        removeConnection(participantId);

        removeParticipant(participantId);
    });

    watch(localParticipantRef, (participant) => {
        emit('updateParticipant', {
            roomId,
            senderParticipantId: participant.id,
            data: omit(participant, 'stream')
        });
    });

    watch(streamRef, (stream, previousStream) => {
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
        participants,
        startCall,
        stopCall
    };
}
