import { computed, onBeforeUnmount, reactive, ref, watch, type Ref } from 'vue';
import { useOnline } from '@vueuse/core';
import { useSocket } from './use-socket';
import { useWebRTC } from './use-web-rtc';
import { pick } from '../utils/helpers';
import { useParticipantsList } from './use-participants-list';
import { useMediaStream } from './use-media-stream';

interface RoomConfig {
    displayName: string;
    isVideoEnabled: Ref<boolean>;
    isAudioEnabled: Ref<boolean>;
    streamConfig: Ref<MediaStreamConstraints>;
    microphoneVolume: Ref<number>;
}

export function useRoom(
    roomId: string,
    {
        displayName,
        isVideoEnabled,
        isAudioEnabled,
        streamConfig,
        microphoneVolume
    }: RoomConfig
) {
    const isOnline = useOnline();

    const {
        stream: localStream,
        start: startLocalStream,
        stop: stopLocalStream
    } = useMediaStream({
        constraints: streamConfig,
        isVideoEnabled,
        isAudioEnabled,
        volume: microphoneVolume
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
        connectToPeer,
        disconnectFromPeer,
        disconnectFromAllPeers,
        createOffer,
        createAnswer,
        processAnswer,
        addIceCandidate
    } = useWebRTC(localStream, {
        onIceCandidate(peerId, iceCandidate) {
            emit('iceCandidate', {
                roomId,
                participantId: localParticipant.id,
                targetParticipantId: peerId,
                iceCandidate
            });
        }
    });

    const isConnecting = ref<boolean>(true);
    const isConnected = ref<boolean>(false);

    function syncLocalParticipant() {
        emit('syncParticipant', {
            roomId,
            participant: pick(localParticipant, 'id', 'name', 'isMuted')
        });
    }

    async function connect() {
        isConnecting.value = true;

        if (!localStream.value) {
            await startLocalStream();
        }

        emit('requestConnection', {
            roomId,
            participantId: localParticipant.id
        });
    }

    function disconnect() {
        stopLocalStream();

        disconnectFromAllPeers();

        clearParticipants();

        emit('disconnectParticipant', {
            roomId,
            participantId: localParticipant.id
        });
    }
    subscribe('connect', () => {
        if (!isConnecting.value) {
            connect();
        }
    });

    subscribe('disconnect', () => {
        isConnected.value = false;
    });

    subscribe('connectionConfirmed', () => {
        isConnecting.value = false;
        isConnected.value = true;

        emit('connectParticipant', {
            roomId,
            participantId: localParticipant.id
        });
    });

    subscribe('participantConnected', async ({ participantId }) => {
        syncLocalParticipant();

        connectToPeer(participantId);

        emit('offer', {
            roomId,
            participantId: localParticipant.id,
            targetParticipantId: participantId,
            offer: await createOffer(participantId)
        });
    });

    subscribe('incomingOffer', async ({ senderParticipantId, offer }) => {
        syncLocalParticipant();

        connectToPeer(senderParticipantId);

        emit('answer', {
            roomId,
            participantId: localParticipant.id,
            targetParticipantId: senderParticipantId,
            answer: await createAnswer(senderParticipantId, offer)
        });
    });

    subscribe('incomingAnswer', ({ senderParticipantId, answer }) => {
        processAnswer(senderParticipantId, answer);
    });

    subscribe(
        'incomingIceCandidate',
        ({ senderParticipantId, iceCandidate }) => {
            addIceCandidate(senderParticipantId, iceCandidate);
        }
    );

    subscribe('participantSynced', async (participant) => {
        const { id: targetParticipantId } = participant;

        if (hasParticipant(targetParticipantId)) {
            updateParticipant(participant);
        } else {
            addParticipant(participant);
        }
    });

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
    });

    watch(isAudioEnabled, () => {
        localParticipant.isMuted = !isAudioEnabled.value;

        syncLocalParticipant();
    });

    onBeforeUnmount(disconnect);

    return {
        isConnecting,
        participants: computed(() => [
            localParticipant,
            ...participants.value.map((item) => ({
                ...item,
                stream: peerStreams.value[item.id]
            }))
        ]),
        toggleMuteParticipant,
        connect,
        disconnect
    };
}
