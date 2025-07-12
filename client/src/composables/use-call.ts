import { v4 as uuid } from 'uuid';
import { useRoom } from './use-room';
import { useStore } from './use-store';
import { computed, reactive, toRefs, watch } from 'vue';
import { closeStream, getStream } from '../utils/media';

export function useCall() {
    const { audioDeviceId, videoDeviceId } = useStore();

    const {
        isConnected,
        isConnecting,
        users,
        getCurrentUser,
        joinRoom,
        updateUser,
        makeCall,
        stopCall,
        sendToggleMicrophone
    } = useRoom('room1');

    const state = reactive<{
        isCameraDisabled: boolean;
        isMicrophoneDisabled: boolean;
    }>({
        isCameraDisabled: false,
        isMicrophoneDisabled: false
    });

    const userId = uuid();

    const currentUser: ClientUser = {
        id: userId,
        name: `user_${userId}`,
        stream: null,
        isMuted: false
    };

    async function fetchCurrentUserStream() {
        if (audioDeviceId.value && videoDeviceId.value) {
            const stream = await getStream({
                audio: { deviceId: audioDeviceId.value },
                video: { deviceId: videoDeviceId.value }
            });

            updateUser(currentUser.id, { stream });
        }
    }

    joinRoom(currentUser);

    watch([audioDeviceId, videoDeviceId], fetchCurrentUserStream, {
        immediate: true
    });

    return {
        ...toRefs(state),
        isConnected,
        isConnecting,
        users,
        areUserDevicesReady: computed(
            () => audioDeviceId.value && videoDeviceId.value
        ),
        async startCall() {
            try {
                await makeCall();
            } catch (error) {
                console.error(error);
            }
        },
        stopCall() {
            const { stream } = getCurrentUser() || {};

            if (stream) {
                closeStream(stream);
            }

            isConnected.value = false;

            stopCall();
        },
        toggleCamera() {
            const { stream } = getCurrentUser() || {};

            if (stream) {
                state.isCameraDisabled = !state.isCameraDisabled;

                stream.getVideoTracks().forEach((track) => {
                    track.enabled = !state.isCameraDisabled;
                });
            }
        },
        async toggleMicrophone() {
            const { stream } = getCurrentUser() || {};

            if (stream) {
                state.isMicrophoneDisabled = !state.isMicrophoneDisabled;

                stream.getAudioTracks().forEach((track) => {
                    track.enabled = !state.isMicrophoneDisabled;
                });

                sendToggleMicrophone();
            }
        }
    };
}
