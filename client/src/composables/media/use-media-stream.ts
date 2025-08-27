import { onBeforeUnmount, watch, type Ref } from 'vue';
import { useUserMedia } from '@vueuse/core';

interface UseMediastreamOptions {
    constraints: Ref<MediaStreamConstraints>;
    isVideoEnabled: Ref<boolean>;
    isAudioEnabled: Ref<boolean>;
    volume: Ref<number>;
}

export function useMediaStream({
    constraints,
    isAudioEnabled,
    isVideoEnabled
}: UseMediastreamOptions) {
    const { stream, start, stop } = useUserMedia({
        constraints
    });

    function setVideoStatus() {
        const videoTracks = stream.value?.getVideoTracks();

        if (videoTracks?.length) {
            for (const track of videoTracks) {
                track.enabled = isVideoEnabled.value;
            }
        }
    }

    function setAudioStatus() {
        const audioTracks = stream.value?.getAudioTracks();

        if (audioTracks?.length) {
            for (const track of audioTracks) {
                track.enabled = isAudioEnabled.value;
            }
        }
    }

    watch(stream, () => {
        setAudioStatus();
        setVideoStatus();
    });

    watch(isVideoEnabled, setVideoStatus);
    watch(isAudioEnabled, setAudioStatus);

    onBeforeUnmount(stop);

    return {
        stream,
        start,
        stop
    };
}
