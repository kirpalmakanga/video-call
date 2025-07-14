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

    async function startCall() {
        emit('call', {
            roomId,
            user: omit(userRef.value, 'stream')
        });
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
    });

    listen('incomingAnswer', ({ senderUserId, answer }) => {
        processAnswer(senderUserId, answer);
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

    watch(userRef, (user) => {
        emit('updateUser', {
            roomId,
            senderUserId: user.id,
            data: omit(user, 'stream')
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

    watch(users, () => {
        if (users.value.length === 0) {
            clearConnections();
        }
    });

    return {
        users,
        startCall,
        stopCall
    };
}
