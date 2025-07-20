import { computed, reactive, ref, watch } from 'vue';

import { useRTCSession } from './use-rtc-session';
import { useSocket } from './use-socket';
import { mergeByKey, omit, pick } from '../utils/helpers';
import { useMediaStream } from './use-media-stream';

export function useRoom(roomId: string) {
    const localParticipant = reactive<ClientParticipant>({
        id: crypto.randomUUID(),
        name: '',
        stream: null,
        isMuted: false,
        isLocalParticipant: true
    });

    function isRemoteParticipant({ id }: ClientParticipant) {
        return id !== localParticipant.id;
    }

    const participants = ref<ClientParticipant[]>([]);

    function removeParticipant(participantId: string) {
        participants.value = participants.value.filter(
            ({ id }) => id !== participantId
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

    const {
        stream,
        isVideoEnabled,
        isAudioEnabled,
        enableStream,
        disableStream,
        toggleVideo,
        toggleAudio
    } = useMediaStream();

    const { emit, subscribe, unsubscribeAll } = useSocket();

    const {
        disconnectFromPeer,
        disconnectFromAllPeers,
        createOffer,
        createAnswer,
        processAnswer,
        addIceCandidate,
        connectToPeer,
        getPeerStream
    } = useRTCSession(stream, {
        onIceCandidate(peerId, candidate) {
            emit('iceCandidate', {
                senderParticipantId: localParticipant.id,
                targetParticipantId: peerId,
                roomId,
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.candidate
            });
        }
    });

    function connectToParticipant(participantId: string) {
        if (localParticipant.stream) {
            connectToPeer(participantId, localParticipant.stream);
        }
    }

    function syncLocalParticipant() {
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

        emit('connectParticipant', {
            roomId,
            participant: omit(localParticipant, 'stream', 'isLocalParticipant')
        });
    }

    function disconnect() {
        disableStream();

        unsubscribeAll();

        disconnectFromAllPeers();

        participants.value = [];

        emit('disconnectParticipant', {
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
        disconnectFromPeer(participantId);

        removeParticipant(participantId);
    });

    watch(stream, (stream) => {
        localParticipant.stream = stream;
    });

    watch(isAudioEnabled, () => {
        localParticipant.isMuted = !isAudioEnabled.value;
    });

    watch(
        () => pick(localParticipant, 'name', 'isMuted'),
        syncLocalParticipant
    );

    return {
        localParticipant,
        participants: computed(() =>
            participants.value.map((item) => ({
                ...item,
                stream: getPeerStream(item.id)
            }))
        ),
        isVideoEnabled,
        isAudioEnabled,
        toggleVideo,
        toggleAudio,
        toggleMuteParticipant,
        connect,
        disconnect
    };
}
