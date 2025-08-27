import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { assertIsDefined } from '../../../../utils/assert';

export function useScreenCapture(stream: Ref<MediaStream | undefined>) {
    const isSharingScreen = ref<boolean>(false);
    let screenStream: MediaStream | null = null;
    let sourceVideoTrack: MediaStreamTrack | null = null;
    let screenVideoTrack: MediaStreamTrack | null = null;

    function stop() {
        if (screenStream) {
            screenStream = null;
        }

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

            screenStream = await navigator.mediaDevices.getDisplayMedia();

            sourceVideoTrack = stream.value.getVideoTracks().at(0) || null;
            screenVideoTrack = screenStream.getVideoTracks().at(0) || null;

            if (sourceVideoTrack && screenVideoTrack) {
                screenVideoTrack.onended = stop;

                stream.value.removeTrack(sourceVideoTrack);
                stream.value.addTrack(screenVideoTrack);

                isSharingScreen.value = true;
            }
        } catch (error) {
            console.error(
                `useScreenCapture Error: ${(error as Error).message}`
            );
        }
    }

    onBeforeUnmount(() => {
        sourceVideoTrack?.stop();

        stop();
    });

    watch(stream, () => {
        sourceVideoTrack?.stop();

        stop();
    });

    return {
        isSharingScreen,
        start,
        stop
    };
}
