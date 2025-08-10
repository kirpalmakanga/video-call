import { computed, onBeforeUnmount, reactive, ref, watch, type Ref } from 'vue';
import { useOnline, useUserMedia } from '@vueuse/core';
import { useSocket } from './use-socket';
import { useRTCSession } from './use-rtc-session';
import { pick } from '../utils/helpers';
import { useParticipantsList } from './use-participants-list';

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
        stream: localStream,
        start: startStream,
        stop: stopStream
    } = useUserMedia({
        constraints: streamConfig
    });

    const { emit, subscribe } = useSocket();

    const localParticipant = reactive<ClientParticipant>({
        id: crypto.randomUUID(),
        name: displayName,
        isMuted: false,
        isLocalParticipant: true
    });

    const {
        participants,
        hasParticipant,
        addParticipant,
        updateParticipant,
        removeParticipant,
        toggleMuteParticipant,
        clearParticipants
    } = useParticipantsList();

    const {
        peerStreams,
        disconnectFromPeer,
        disconnectFromAllPeers,
        createOffer,
        createAnswer,
        processAnswer,
        addIceCandidate,
        connectToPeer
    } = useRTCSession(localStream, {
        onIceCandidate(peerId, candidate) {
            emit('iceCandidate', {
                roomId,
                senderParticipantId: localParticipant.id,
                targetParticipantId: peerId,
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.candidate
            });
        }
    });

    const isConnecting = ref<boolean>(true);
    const isConnected = ref<boolean>(false);
    const isReconnecting = ref<boolean>(false);

    function getLocalParticipantForServer(): Participant {
        return pick(localParticipant, 'id', 'name', 'isMuted');
    }

    function syncLocalParticipant() {
        emit('syncParticipant', {
            roomId,
            participant: getLocalParticipantForServer()
        });
    }

    function setVideoStatus() {
        const videoTracks = localStream.value?.getVideoTracks();

        if (videoTracks?.length) {
            for (const track of videoTracks) {
                track.enabled = isVideoEnabled.value;
            }
        }
    }

    function setAudioStatus() {
        const audioTracks = localStream.value?.getAudioTracks();

        if (audioTracks?.length) {
            for (const track of audioTracks) {
                track.enabled = isAudioEnabled.value;
            }
        }

        localParticipant.isMuted = !isAudioEnabled.value;
    }

    async function connect() {
        isConnecting.value = true;

        if (!localStream.value) {
            await startStream();

            setAudioStatus();
            setVideoStatus();
        }

        emit('connectParticipant', {
            roomId,
            participant: getLocalParticipantForServer()
        });
    }

    function disconnect() {
        stopStream();

        disconnectFromAllPeers();

        clearParticipants();

        if (isOnline.value) {
            emit('disconnectParticipant', {
                roomId,
                participantId: localParticipant.id
            });
        }
    }

    subscribe('disconnect', () => {
        isConnected.value = false;
    });

    subscribe('connect', () => {
        if (!isConnecting.value) {
            connect();
        }
    });

    subscribe('connectedToRoom', () => {
        isConnecting.value = false;
        isConnected.value = true;
    });

    subscribe('participantSynced', async (participant) => {
        const { id: targetParticipantId } = participant;

        if (hasParticipant(targetParticipantId)) {
            updateParticipant(participant);
        } else {
            addParticipant(participant);
        }
    });

    subscribe('participantConnected', async ({ participantId }) => {
        syncLocalParticipant();

        connectToPeer(participantId);

        emit('offer', {
            roomId,
            senderParticipantId: localParticipant.id,
            targetParticipantId: participantId,
            offer: await createOffer(participantId)
        });
    });

    subscribe('incomingOffer', async ({ senderParticipantId, offer }) => {
        syncLocalParticipant();

        connectToPeer(senderParticipantId);

        emit('answer', {
            roomId,
            senderParticipantId: localParticipant.id,
            targetParticipantId: senderParticipantId,
            answer: await createAnswer(senderParticipantId, offer)
        });
    });

    subscribe('incomingAnswer', async ({ senderParticipantId, answer }) => {
        await processAnswer(senderParticipantId, answer);
    });

    subscribe(
        'incomingIceCandidate',
        ({ senderParticipantId, sdpMLineIndex, candidate }) => {
            addIceCandidate(senderParticipantId, sdpMLineIndex, candidate);
        }
    );

    subscribe('participantDisconnected', ({ participantId }) => {
        disconnectFromPeer(participantId);

        removeParticipant(participantId);
    });

    watch(isOnline, (value) => {
        if (value) {
            connect();
        } else {
            disconnect();
        }
    });

    watch(localStream, (stream) => {
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

    onBeforeUnmount(disconnect);

    return {
        isConnecting,
        isReconnecting,
        participants: computed(() => [
            localParticipant,
            ...participants.value.map((item) => ({
                ...item,
                stream: peerStreams.value[item.id] || null
            }))
        ]),
        toggleMuteParticipant,
        connect,
        disconnect
    };
}
