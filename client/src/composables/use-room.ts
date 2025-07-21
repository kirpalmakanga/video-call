import { computed, reactive, ref, watch, type Ref } from 'vue';
import { useOnline, useUserMedia } from '@vueuse/core';
import { useSocket } from './use-socket';
import { useRTCSession } from './use-rtc-session';
import { mergeByKey, omit } from '../utils/helpers';

interface RoomConfig {
    displayName: string;
    isVideoEnabled: Ref<boolean>;
    isAudioEnabled: Ref<boolean>;
    streamConfig: Ref<MediaStreamConstraints>;
}

export function useRoom(
    roomId: string,
    { displayName, isVideoEnabled, isAudioEnabled, streamConfig }: RoomConfig
) {
    const isOnline = useOnline();

    const {
        stream,
        start: startStream,
        stop: stopStream
    } = useUserMedia({
        constraints: streamConfig
    });

    const { emit, subscribe, unsubscribe } = useSocket();

    const localParticipant = reactive<ClientParticipant>({
        id: crypto.randomUUID(),
        name: displayName,
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
            participant.isLocallyMuted = !participant.isLocallyMuted;
        }
    }

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

    function setupPeerConnection(participantId: string) {
        if (stream.value) {
            connectToPeer(participantId, stream.value);
        }
    }

    function syncLocalParticipant() {
        emit('updateParticipant', {
            roomId,
            senderParticipantId: localParticipant.id,
            data: omit(localParticipant, 'stream', 'isLocalParticipant')
        });
    }

    function setVideoStatus() {
        const videoTracks = stream.value?.getVideoTracks();

        if (videoTracks?.length) {
            for (const track of videoTracks) {
                track.enabled = isVideoEnabled.value;
            }
        }
    }

    function setAudioStatus() {
        const audioTracks = stream.value?.getAudioTracks();

        if (audioTracks?.length) {
            for (const track of audioTracks) {
                track.enabled = isAudioEnabled.value;
            }
        }

        localParticipant.isMuted = !isAudioEnabled.value;
    }

    async function connect() {
        if (!stream.value) {
            await startStream();

            setAudioStatus();
            setVideoStatus();
        }

        emit('connectParticipant', {
            roomId,
            participant: omit(localParticipant, 'stream', 'isLocalParticipant')
        });
    }

    function disconnect() {
        stopStream();

        unsubscribe();

        disconnectFromAllPeers();

        participants.value = [];

        emit('disconnectParticipant', {
            roomId,
            participantId: localParticipant.id
        });
    }

    subscribe(
        'participantConnected',
        async ({ roomId, senderParticipantId }) => {
            setupPeerConnection(senderParticipantId);

            emit('offer', {
                roomId,
                senderParticipantId: localParticipant.id,
                targetParticipantId: senderParticipantId,
                offer: await createOffer(senderParticipantId)
            });
        }
    );

    subscribe(
        'incomingOffer',
        async ({ roomId, senderParticipantId, offer }) => {
            setupPeerConnection(senderParticipantId);

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

    watch(isOnline, (isOnline) => {
        if (isOnline) {
            connect();
        }
    });

    watch(stream, (stream) => {
        localParticipant.stream = stream;

        if (stream) {
            setAudioStatus();
            setVideoStatus();
        }
    });

    watch(isVideoEnabled, setVideoStatus);

    watch(isAudioEnabled, () => {
        setAudioStatus();

        syncLocalParticipant();
    });

    return {
        localParticipant,
        participants: computed(() =>
            participants.value.map((item) => ({
                ...item,
                stream: getPeerStream(item.id)
            }))
        ),
        toggleMuteParticipant,
        connect,
        disconnect
    };
}
