import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { useOnline } from '@vueuse/core';
import { useSocket } from './use-socket';
import { useWebRTC } from './use-web-rtc';
import { pick } from '../utils/helpers';
import { useParticipantsList } from './use-participants-list';

interface RoomConfig {
    localStream: Ref<MediaStream | undefined>;
    displayName: string;
    isVideoEnabled: Ref<boolean>;
    isAudioEnabled: Ref<boolean>;
}

export function useRoom(roomId: string, { localStream, displayName, isAudioEnabled }: RoomConfig) {
    const localParticipantId = crypto.randomUUID();
    const isOnline = useOnline();

    const { emit, subscribe } = useSocket();

    const localParticipant = computed<ClientParticipant>(() => ({
        id: localParticipantId,
        name: displayName,
        isMuted: !isAudioEnabled.value,
        isLocalParticipant: true,
        stream: localStream.value
    }));

    const {
        participants,
        setParticipant,
        removeParticipant,
        toggleMuteParticipant,
        clearParticipants
    } = useParticipantsList();

    const {
        peerStreams,
        connectToPeer,
        syncLocalStreamWithPeers,
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
                participantId: localParticipant.value.id,
                targetParticipantId: peerId,
                iceCandidate
            });
        },
        onPeerDisconnection(peerId) {
            removeParticipant(peerId);
        }
    });

    const isConnecting = ref<boolean>(true);
    const isConnected = ref<boolean>(false);

    function syncLocalParticipant() {
        emit('syncParticipant', {
            roomId,
            participant: pick(localParticipant.value, 'id', 'name', 'isMuted')
        });
    }

    function connect() {
        isConnecting.value = true;

        emit('requestConnection', {
            roomId,
            participantId: localParticipant.value.id
        });
    }

    function disconnect() {
        disconnectFromAllPeers();

        clearParticipants();

        emit('disconnectParticipant', {
            roomId,
            participantId: localParticipant.value.id
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
            participantId: localParticipant.value.id
        });
    });

    subscribe('participantConnected', async ({ participantId }) => {
        syncLocalParticipant();

        await connectToPeer(participantId);

        emit('offer', {
            roomId,
            participantId: localParticipant.value.id,
            targetParticipantId: participantId,
            offer: await createOffer(participantId)
        });
    });

    subscribe('incomingOffer', async ({ senderParticipantId, offer }) => {
        syncLocalParticipant();

        await connectToPeer(senderParticipantId);

        emit('answer', {
            roomId,
            participantId: localParticipant.value.id,
            targetParticipantId: senderParticipantId,
            answer: await createAnswer(senderParticipantId, offer)
        });
    });

    subscribe('incomingAnswer', async ({ senderParticipantId, answer }) => {
        await processAnswer(senderParticipantId, answer);
    });

    subscribe('incomingIceCandidate', async ({ senderParticipantId, iceCandidate }) => {
        await addIceCandidate(senderParticipantId, iceCandidate);
    });

    subscribe('participantSynced', setParticipant);

    subscribe('participantDisconnected', ({ participantId }) => {
        disconnectFromPeer(participantId);

        removeParticipant(participantId);
    });

    watch(isOnline, async (value) => {
        if (value) {
            connect();
        } else {
            disconnect();
        }
    });

    watch(isAudioEnabled, syncLocalParticipant);

    onBeforeUnmount(disconnect);

    return {
        isConnecting,
        participants: computed(() => [
            localParticipant.value,
            ...participants.value.map((item) => ({
                ...item,
                stream: peerStreams.value[item.id]
            }))
        ]),
        syncLocalStream: syncLocalStreamWithPeers,
        toggleMuteParticipant,
        connect,
        disconnect
    };
}
