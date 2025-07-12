import { ref, watch } from 'vue';

import { useRTCSession } from './use-rtc-session.js';
import { useSocket } from './use-socket.js';
import { mergeByKey, omit } from '../utils/helpers.js';

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
        const index = users.value.findIndex(({ id }) => id === userId);

        if (index > -1) {
            users.value.splice(index, 1);
        }
    }

    function isLocalUser({ id }: ClientUser) {
        return users.value[0]?.id === id;
    }

    function getCurrentUser() {
        return users.value[0];
    }

    function updateUser(userId: string, data: Partial<ClientUser>) {
        const index = users.value.findIndex(({ id }) => id === userId);
        const user = users.value[index];

        if (user) {
            users.value.splice(index, 1, { ...user, ...data });
        }
    }

    function sendLocalStream(remotePeerId: string) {
        const user = getCurrentUser();

        if (user?.stream) {
            bindStreamToConnection(remotePeerId, user.stream);
        }
    }

    function joinRoom(user: ClientUser) {
        users.value.push({ ...user, isLocalUser: true });

        emit('join', { roomId, user: omit(user, 'stream') });
    }

    async function makeCall() {
        const user = getCurrentUser();

        isConnecting.value = true;

        if (user) {
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

    listen<{ users: ClientUser[] }>(
        'usersListUpdated',
        ({ users: updatedUsersList }) => {
            users.value = mergeByKey(
                users.value.filter(
                    (user) =>
                        isLocalUser(user) ||
                        updatedUsersList.some(
                            (updatedUser) => updatedUser.id !== user.id
                        )
                ),
                updatedUsersList.filter((user) => !isLocalUser(user)),
                'id'
            );
        }
    );

    listen<{ userId: string }>('removedUser', ({ userId }) => {
        removeConnection(userId);

        removeUser(userId);
    });

    listen<{ roomId: string; senderUserId: string }>(
        'call',
        async ({ roomId, senderUserId }) => {
            const currentUser = getCurrentUser();

            if (currentUser?.stream) {
                setupPeerConnection(senderUserId, {
                    onStreamAvailable(stream) {
                        updateUser(senderUserId, { stream });
                    },
                    onDisconnection() {
                        removeUser(senderUserId);
                    },
                    onIceCandidate(candidate) {
                        sendCandidate(currentUser.id, senderUserId, candidate);
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
        }
    );

    listen<{
        roomId: string;
        senderUserId: string;
        offer: RTCSessionDescriptionInit;
    }>('offer', async ({ roomId, senderUserId, offer }) => {
        const currentUser = getCurrentUser();

        if (currentUser?.stream) {
            setupPeerConnection(senderUserId, {
                onStreamAvailable(stream) {
                    updateUser(senderUserId, { stream });
                },
                onDisconnection() {
                    removeUser(senderUserId);
                },
                onIceCandidate(candidate) {
                    sendCandidate(currentUser.id, senderUserId, candidate);
                }
            });

            sendLocalStream(senderUserId);

            emit('answer', {
                roomId,
                senderUserId: currentUser.id,
                receiverUser: senderUserId,
                answer: await createAnswer(senderUserId, offer)
            });
        }

        setCallInProgress();
    });

    listen<{ senderUserId: string; answer: RTCSessionDescriptionInit }>(
        'answer',
        ({ senderUserId, answer }) => {
            processAnswer(senderUserId, answer);

            setCallInProgress();
        }
    );

    listen<{ remotePeerId: string; sdpMLineIndex: number; candidate: string }>(
        'iceCandidate',
        ({ remotePeerId, sdpMLineIndex, candidate }) => {
            addIceCandidate(remotePeerId, sdpMLineIndex, candidate);
        }
    );

    listen<{ senderUserId: string; isMuted: boolean }>(
        'toggleMicrophone',
        ({ senderUserId, isMuted }) => {
            updateUser(senderUserId, { isMuted });
        }
    );

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
