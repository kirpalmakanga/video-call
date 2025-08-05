import { computed, onBeforeUnmount, reactive, ref, watch, type Ref } from 'vue';
import { useOnline, useUserMedia } from '@vueuse/core';
import { useSocket } from './use-socket';
import { useRTCSession } from './use-rtc-session';
import { pick, update } from '../utils/helpers';

interface RoomConfig {
    displayName: string;
    isVideoEnabled: Ref<boolean>;
    isAudioEnabled: Ref<boolean>;
    streamConfig: Ref<MediaStreamConstraints>;
}

function useParticipantsList() {
    const participants = ref<ClientParticipant[]>([]);

    return {
        participants,
        hasParticipant(participantId: string) {
            return participants.value.some(({ id }) => id === participantId);
        },
        addParticipant(participant: ClientParticipant) {
            participants.value.push(participant);
        },
        updateParticipant(participant: ClientParticipant) {
            participants.value = update(
                participants.value,
                ({ id }) => id === participant.id,
                participant
            );
        },
        removeParticipant(participantId: string) {
            participants.value = participants.value.filter(
                ({ id }) => id !== participantId
            );
        },
        toggleMuteParticipant(participantId: string) {
            const participant = participants.value.find(
                ({ id }) => id === participantId
            );

            if (participant) {
                participant.isLocallyMuted = !participant.isLocallyMuted;
            }
        },
        clearParticipants() {
            participants.value = [];
        }
    };
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

    const { emit, subscribe, unsubscribe } = useSocket();

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
        hasPeer,
        disconnectFromPeer,
        disconnectFromAllPeers,
        createOffer,
        createAnswer,
        processAnswer,
        addIceCandidate,
        connectToPeer,
        getPeerStream
    } = useRTCSession(localStream, {
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

        unsubscribe();

        disconnectFromAllPeers();

        clearParticipants();

        emit('disconnectParticipant', {
            roomId,
            participantId: localParticipant.id
        });
    }

    subscribe('participantSynced', async ({ participant }) => {
        const { id: targetParticipantId } = participant;

        if (hasParticipant(targetParticipantId)) {
            updateParticipant(participant);
        } else {
            addParticipant(participant);
        }
    });

    subscribe('participantConnected', async ({ senderParticipantId }) => {
        connectToPeer(senderParticipantId);

        syncLocalParticipant();

        emit('offer', {
            roomId,
            senderParticipantId: localParticipant.id,
            targetParticipantId: senderParticipantId,
            offer: await createOffer(senderParticipantId)
        });
    });

    subscribe('incomingOffer', async ({ senderParticipantId, offer }) => {
        connectToPeer(senderParticipantId);

        syncLocalParticipant();

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

    watch(isOnline, (isOnline) => {
        if (isOnline) {
            connect();
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
        participants: computed(() => [
            localParticipant,
            ...participants.value.map((item) => ({
                ...item,
                stream: getPeerStream(item.id)
            }))
        ]),
        toggleMuteParticipant,
        connect,
        disconnect
    };
}
