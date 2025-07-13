import { ref, watch, type Ref } from 'vue';

import { useRTCSession } from './use-rtc-session';
import { useSocket } from './use-socket';
import { mergeByKey, omit, update } from '../utils/helpers';

interface RoomConfig {
    roomId: string;
    userRef: Ref<ClientUser>;
    streamRef: Ref<MediaStream | null>;
}

export function useRoom({ roomId, userRef, streamRef }: RoomConfig) {
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

    const users = ref<ClientUser[]>([]);
    const isConnected = ref<boolean>(false);
    const isConnecting = ref<boolean>(false);

    function removeUser(userId: string) {
        users.value = users.value.filter(({ id }) => id !== userId);
    }

    function isRemoteUser({ id }: ClientUser) {
        return id !== userRef.value.id;
    }

    function updateUser(userId: string, data: Partial<ClientUser>) {
        users.value = update(users.value, ({ id }) => id === userId, data);
    }

    function sendLocalStream(remotePeerId: string) {
        if (streamRef.value) {
            bindStreamToConnection(remotePeerId, streamRef.value);
        }
    }

    function joinRoom() {
        emit('joinRoom', { roomId, user: omit(userRef.value, 'stream') });
    }

    async function startCall() {
        isConnecting.value = true;

        // emit('join', { roomId, user: omit(userRef.value, 'stream') });

        emit('call', {
            roomId,
            senderUserId: userRef.value.id
        });
    }

    function setCallInProgress() {
        if (!isConnected.value) {
            isConnected.value = true;

            isConnecting.value = false;
        }
    }

    function stopCall() {
        emit('leaveRoom', {
            roomId,
            userId: userRef.value.id
        });

        clearConnections();
    }

    function sendCandidate(
        remotePeerId: string,
        senderUserId: string,
        candidate: RTCIceCandidateInit
    ) {
        emit('iceCandidate', {
            senderUserId,
            remotePeerId,
            roomId,
            sdpMLineIndex: candidate.sdpMLineIndex,
            candidate: candidate.candidate
        });
    }

    function sendMicrophoneStatus(isMuted: boolean) {
        emit('toggleMicrophone', {
            roomId,
            senderUserId: userRef.value.id,
            isMuted
        });
    }

    listen('incomingCall', async ({ roomId, senderUserId }) => {
        if (streamRef.value) {
            setupPeerConnection(senderUserId, {
                onIceCandidate(candidate) {
                    sendCandidate(userRef.value.id, senderUserId, candidate);
                },
                onStreamAvailable(stream) {
                    updateUser(senderUserId, { stream });
                },
                onDisconnection() {
                    removeUser(senderUserId);
                }
            });

            sendLocalStream(senderUserId);

            emit('offer', {
                roomId,
                senderUserId: userRef.value.id,
                receiverUserId: senderUserId,
                offer: await createOffer(senderUserId)
            });
        }
    });

    listen('incomingOffer', async ({ roomId, senderUserId, offer }) => {
        if (streamRef.value) {
            setupPeerConnection(senderUserId, {
                onIceCandidate(candidate) {
                    sendCandidate(userRef.value.id, senderUserId, candidate);
                },
                onStreamAvailable(stream) {
                    updateUser(senderUserId, { stream });
                },
                onDisconnection() {
                    removeUser(senderUserId);
                }
            });

            sendLocalStream(senderUserId);

            emit('answer', {
                roomId,
                senderUserId: userRef.value.id,
                receiverUserId: senderUserId,
                answer: await createAnswer(senderUserId, offer)
            });
        }

        // setCallInProgress();
    });

    listen('incomingAnswer', ({ senderUserId, answer }) => {
        processAnswer(senderUserId, answer);

        // setCallInProgress();
    });

    listen(
        'incomingIceCandidate',
        ({ remotePeerId, sdpMLineIndex, candidate }) => {
            addIceCandidate(remotePeerId, sdpMLineIndex, candidate);
        }
    );

    listen('usersListUpdated', ({ users: updatedUsersList }) => {
        users.value = mergeByKey(
            users.value,
            updatedUsersList.filter(isRemoteUser),
            'id'
        );
    });

    listen('userDisconnected', ({ userId }) => {
        removeConnection(userId);

        removeUser(userId);
    });

    watch(streamRef, (stream, previousStream) => {
        if (!isConnected.value) {
            return;
        }

        if (previousStream) {
            removeStreamFromAllConnections();
        }

        if (stream) {
            bindStreamToAllConnections(stream);
        }
    });

    watch(users, () => {
        if (users.value.length === 0) {
            isConnected.value = false;

            clearConnections();
        }
    });

    return {
        users,
        isConnected,
        isConnecting,
        joinRoom,
        startCall,
        stopCall,
        sendMicrophoneStatus
    };
}
