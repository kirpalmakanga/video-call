import { computed, onBeforeUnmount, reactive, ref, watch, type Ref } from 'vue';
import { useOnline, useUserMedia } from '@vueuse/core';
import { useSocket } from './use-socket';
import { useRTCSession } from './use-rtc-session';
import { mergeByKey, omit, pick } from '../utils/helpers';

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
        emit('updateParticipant', {
            roomId,
            senderParticipantId: localParticipant.id,
            data: getLocalParticipantForServer()
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

        participants.value = [];

        emit('disconnectParticipant', {
            roomId,
            participantId: localParticipant.id
        });
    }

    subscribe('participantConnected', async ({ participant }) => {
        const { id: targetParticipantId } = participant;
        connectToPeer(targetParticipantId);

        participants.value.push(participant);

        emit('offer', {
            roomId,
            senderParticipantId: localParticipant.id,
            targetParticipantId,
            offer: await createOffer(targetParticipantId)
        });
    });

    subscribe(
        'incomingOffer',
        async ({ roomId, senderParticipantId, offer }) => {
            connectToPeer(senderParticipantId);

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
