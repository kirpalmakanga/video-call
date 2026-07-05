import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { useDisplayMedia } from '@vueuse/core';
import { assertIsDefined } from '../../../../shared/utils/assert';

export function useScreenCapture(stream: Ref<MediaStream | undefined>) {
    const { stream: displayMediaStream, start: startDisplayMedia } = useDisplayMedia();

    const isSharingScreen = ref<boolean>(false);
    let sourceVideoTrack: MediaStreamTrack | null = null;
    let screenVideoTrack: MediaStreamTrack | null = null;

    function stop() {
        if (sourceVideoTrack && screenVideoTrack) {
            stream.value?.removeTrack(screenVideoTrack);
            stream.value?.addTrack(sourceVideoTrack);

            screenVideoTrack.onended = null;
            screenVideoTrack.stop();
            sourceVideoTrack = null;
            screenVideoTrack = null;
        }

        isSharingScreen.value = false;
    }

    async function start() {
        try {
            if (isSharingScreen.value) {
                throw new Error('Screen is already being shared');
            }

            assertIsDefined(stream.value, 'Source stream unavailable');

            await startDisplayMedia();

            assertIsDefined(displayMediaStream.value, 'Display media stream unavailable');

            sourceVideoTrack = stream.value.getVideoTracks().at(0) || null;
            screenVideoTrack = displayMediaStream.value.getVideoTracks().at(0) || null;

            if (sourceVideoTrack && screenVideoTrack) {
                screenVideoTrack.onended = stop;

                stream.value.removeTrack(sourceVideoTrack);
                stream.value.addTrack(screenVideoTrack);

                isSharingScreen.value = true;
            }
        } catch (error) {
            console.error(`useScreenCapture Error: ${(error as Error).message}`);
        }
    }

    function cleanup() {
        sourceVideoTrack?.stop();

        stop();
    }

    onBeforeUnmount(cleanup);

    watch(stream, () => !stream.value && cleanup());

    return {
        isSharingScreen,
        start,
        stop
    };
}
