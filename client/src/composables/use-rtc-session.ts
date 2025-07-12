import { ref } from 'vue';

// const configuration = {
//     iceServers: [
//         {
//             urls: 'stun:stun.1.google.com:19302'
//         }
//     ]
// };

export function useRTCSession() {
    const peerConnections = ref<Map<string, RTCPeerConnection>>(new Map());

    function hasConnection(remotePeerId: string) {
        return !!peerConnections.value.has(remotePeerId);
    }

    function createConnection(remotePeerId: string) {
        const connection = new RTCPeerConnection();

        peerConnections.value.set(remotePeerId, connection);

        return connection;
    }

    function getConnection(remotePeerId: string) {
        let connection = peerConnections.value.get(remotePeerId);

        if (!connection) {
            connection = createConnection(remotePeerId);
        }

        return connection;
    }

    function bindStreamToConnection(remotePeerId: string, stream: MediaStream) {
        const peerConnection = getConnection(remotePeerId);

        stream
            .getTracks()
            .forEach((track) => peerConnection.addTrack(track, stream));
    }

    function removeStreamFromConnection(remotePeerId: string) {
        const peerConnection = getConnection(remotePeerId);

        peerConnection
            .getSenders()
            .forEach((sender) => peerConnection.removeTrack(sender));
    }

    return {
        removeConnection(remotePeerId: string) {
            if (peerConnections.value.has(remotePeerId)) {
                peerConnections.value.get(remotePeerId)?.close();
                peerConnections.value.delete(remotePeerId);
            }
        },
        clearConnections() {
            Object.values(peerConnections.value).map((connection) =>
                connection.close()
            );

            peerConnections.value.clear();
        },
        async createOffer(remotePeerId: string) {
            const peerConnection = getConnection(remotePeerId);

            const offer = await peerConnection.createOffer();

            await peerConnection.setLocalDescription(
                new RTCSessionDescription(offer)
            );

            return offer;
        },
        async createAnswer(
            remotePeerId: string,
            offer: RTCSessionDescriptionInit
        ) {
            const peerConnection = getConnection(remotePeerId);

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            const answer = await peerConnection.createAnswer();

            await peerConnection.setLocalDescription(
                new RTCSessionDescription(answer)
            );

            return answer;
        },
        async processAnswer(
            remotePeerId: string,
            answer: RTCSessionDescriptionInit
        ) {
            const peerConnection = getConnection(remotePeerId);

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        },
        bindStreamToConnection,
        bindStreamToAllConnections(stream: MediaStream) {
            if (peerConnections.value.size) {
                peerConnections.value.forEach((_, remotePeerId) => {
                    bindStreamToConnection(remotePeerId, stream);
                });
            }
        },
        removeStreamFromConnection,
        removeStreamFromAllConnections() {
            if (peerConnections.value.size) {
                peerConnections.value.forEach((_, remotePeerId) => {
                    removeStreamFromConnection(remotePeerId);
                });
            }
        },
        addIceCandidate(
            remotePeerId: string,
            sdpMLineIndex: number,
            candidate: string
        ) {
            getConnection(remotePeerId).addIceCandidate(
                new RTCIceCandidate({
                    sdpMLineIndex,
                    candidate
                })
            );
        },
        setupPeerConnection(
            remotePeerId: string,
            {
                onStreamAvailable,
                onDisconnection,
                onIceCandidate
            }: {
                onStreamAvailable: (remoteStream: MediaStream | null) => void;
                onDisconnection: () => void;
                onIceCandidate: (candidate: RTCIceCandidate) => void;
            }
        ) {
            const peerConnection = createConnection(remotePeerId);

            peerConnection.ontrack = ({ streams: [stream = null] }) => {
                onStreamAvailable(stream);
            };

            peerConnection.oniceconnectionstatechange = () => {
                const { iceConnectionState } = peerConnection;

                if (
                    iceConnectionState === 'failed' ||
                    iceConnectionState === 'closed' ||
                    iceConnectionState === 'disconnected'
                ) {
                    onDisconnection();
                }
            };

            peerConnection.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    onIceCandidate(candidate);
                }
            };
        }
    };
}
