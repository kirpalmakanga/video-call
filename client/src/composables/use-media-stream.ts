import { reactive, toRefs } from 'vue';
import { closeStream, createStream } from '../utils/media';

interface StreamState {
    stream: MediaStream | null;
    isLoadingStream: boolean;
    hasStreamError: boolean;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
}

export function useMediaStream() {
    const state = reactive<StreamState>({
        stream: null,
        isLoadingStream: false,
        hasStreamError: false,
        isVideoEnabled: true,
        isAudioEnabled: true
    });

    function setVideoTracksStatus() {
        state.stream?.getVideoTracks().forEach((track) => {
            track.enabled = state.isVideoEnabled;
        });
    }

    function setAudioTracksStatus() {
        state.stream?.getAudioTracks().forEach((track) => {
            track.enabled = state.isAudioEnabled;
        });
    }

    return {
        ...toRefs(state),
        async enableStream(config: MediaStreamConstraints) {
            if (state.stream) {
                closeStream(state.stream);
            }

            try {
                state.isLoadingStream = true;

                state.stream = await createStream(config);

                setVideoTracksStatus();
                setAudioTracksStatus();
            } catch (e) {
                state.hasStreamError = true;
            } finally {
                state.isLoadingStream = false;
            }
        },
        disableStream() {
            if (state.stream) {
                closeStream(state.stream);

                state.stream = null;
            }
        },
        toggleVideo() {
            if (state.stream) {
                state.isVideoEnabled = !state.isVideoEnabled;

                setVideoTracksStatus();
            }
        },
        toggleAudio() {
            if (state.stream) {
                state.isAudioEnabled = !state.isAudioEnabled;

                setAudioTracksStatus();
            }
        }
    };
}
