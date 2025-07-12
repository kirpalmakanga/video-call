import { ref, watch } from 'vue';

import { useRTCSession } from './use-rtc-session.js';
import { useSocket } from './use-socket.js';
import { mergeByKey, omit, update } from '../utils/helpers.js';

export function useRoom(roomId: string) {
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

    function isLocalUser({ id }: ClientUser) {
        return users.value[0]?.id === id;
    }

    function getCurrentUser() {
        return users.value[0];
    }

    function updateUser(userId: string, data: Partial<ClientUser>) {
        users.value = update(users.value, ({ id }) => id === userId, data);
    }

    function sendLocalStream(remotePeerId: string) {
        const user = getCurrentUser();

        if (user?.stream) {
            bindStreamToConnection(remotePeerId, user.stream);
        }
    }

    function joinRoom(user: ClientUser) {
        users.value.push({ ...user, isLocalUser: true });

        emit('join', { roomId, user: omit(user, 'stream', 'isLocalUser') });
    }

    async function makeCall() {
        const user = getCurrentUser();

        if (user) {
            isConnecting.value = true;

            emit('call', {
                roomId,
                senderUserId: user.id
            });
        }
    }

    function setCallInProgress() {
        if (!isConnected.value) {
            isConnected.value = true;

            isConnecting.value = false;
        }
    }

    function stopCall() {
        const user = getCurrentUser();

        if (user) {
            emit('leave', {
                roomId,
                userId: user.id
            });
        }

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

    function sendToggleMicrophone() {
        const currentUser = getCurrentUser();

        if (currentUser) {
            const isMuted = !currentUser.isMuted;

            emit('toggleMicrophone', {
                roomId,
                senderUserId: currentUser.id,
                isMuted
            });

            updateUser(currentUser.id, { isMuted });
        }
    }

    listen('call', async ({ roomId, senderUserId }) => {
        const currentUser = getCurrentUser();

        if (currentUser?.stream) {
            setupPeerConnection(senderUserId, {
                onIceCandidate(candidate) {
                    sendCandidate(currentUser.id, senderUserId, candidate);
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
                senderUserId: currentUser.id,
                receiverUserId: senderUserId,
                offer: await createOffer(senderUserId)
            });
        }
    });

    listen('offer', async ({ roomId, senderUserId, offer }) => {
        const currentUser = getCurrentUser();

        if (currentUser?.stream) {
            setupPeerConnection(senderUserId, {
                onIceCandidate(candidate) {
                    sendCandidate(currentUser.id, senderUserId, candidate);
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
                senderUserId: currentUser.id,
                receiverUserId: senderUserId,
                answer: await createAnswer(senderUserId, offer)
            });
        }

        setCallInProgress();
    });

    listen('answer', ({ senderUserId, answer }) => {
        processAnswer(senderUserId, answer);

        setCallInProgress();
    });

    listen('iceCandidate', ({ remotePeerId, sdpMLineIndex, candidate }) => {
        addIceCandidate(remotePeerId, sdpMLineIndex, candidate);
    });

    listen('usersListUpdated', ({ users: updatedUsersList }) => {
        users.value = mergeByKey(
            users.value,
            updatedUsersList.filter((user) => !isLocalUser(user)),
            'id'
        );
    });

    listen('userDisconnected', ({ userId }) => {
        removeConnection(userId);

        removeUser(userId);
    });

    watch(
        () => getCurrentUser()?.stream,
        (stream, previousStream) => {
            if (!isConnected.value) {
                return;
            }

            if (previousStream) {
                removeStreamFromAllConnections();
            }

            if (stream) {
                bindStreamToAllConnections(stream);
            }
        }
    );

    watch(users, () => {
        if (isConnected.value && users.value.length <= 1) {
            isConnected.value = false;

            clearConnections();
        }
    });

    return {
        users,
        isConnected,
        isConnecting,
        getCurrentUser,
        joinRoom,
        updateUser,
        makeCall,
        stopCall,
        sendToggleMicrophone
    };
}
