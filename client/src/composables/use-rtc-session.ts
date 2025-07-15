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

    function hasConnections() {
        return !!peerConnections.value.size;
    }

    function removeConnection(remotePeerId: string) {
        if (peerConnections.value.has(remotePeerId)) {
            peerConnections.value.get(remotePeerId)?.close();
            peerConnections.value.delete(remotePeerId);
        }
    }

    function createConnection(remotePeerId: string) {
        removeConnection(remotePeerId);

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
        removeConnection,
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
            await getConnection(remotePeerId).setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        },
        bindStreamToConnection,
        bindStreamToAllConnections(stream: MediaStream) {
            if (hasConnections()) {
                for (const remotePeerId of peerConnections.value.keys()) {
                    bindStreamToConnection(remotePeerId, stream);
                }
            }
        },
        removeStreamFromConnection,
        removeStreamFromAllConnections() {
            if (hasConnections()) {
                for (const remotePeerId of peerConnections.value.keys()) {
                    removeStreamFromConnection(remotePeerId);
                }
            }
        },
        async addIceCandidate(
            remotePeerId: string,
            sdpMLineIndex: number,
            candidate: string
        ) {
            await getConnection(remotePeerId).addIceCandidate(
                new RTCIceCandidate({
                    sdpMLineIndex,
                    candidate
                })
            );
        },
        setupPeerConnection(
            remotePeerId: string,
            {
                onIceCandidate,
                onStreamAvailable,
                onDisconnection
            }: {
                onIceCandidate: (candidate: RTCIceCandidate) => void;
                onStreamAvailable: (remoteStream: MediaStream | null) => void;
                onDisconnection: () => void;
            }
        ) {
            const peerConnection = createConnection(remotePeerId);

            peerConnection.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    onIceCandidate(candidate);
                }
            };

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
        }
    };
}
