import { onBeforeUnmount, ref, type Ref } from 'vue';
import { assertIsDefined } from '../../../utils/assert';

export function useScreenCapture(sourceStream: Ref<MediaStream | undefined>) {
    const isSharingScreen = ref<boolean>(false);
    let screenStream: MediaStream | null = null;
    let sourceVideoTrack: MediaStreamTrack | null = null;
    let screenVideoTrack: MediaStreamTrack | null = null;

    async function start() {
        try {
            if (isSharingScreen.value) {
                throw new Error('Screen is already being shared');
            }

            assertIsDefined(sourceStream.value, 'Source stream unavailable');

            screenStream = await navigator.mediaDevices.getDisplayMedia();

            sourceVideoTrack =
                sourceStream.value.getVideoTracks().at(0) || null;
            screenVideoTrack = screenStream.getVideoTracks().at(0) || null;

            if (sourceVideoTrack && screenVideoTrack) {
                sourceStream.value.removeTrack(sourceVideoTrack);
                sourceStream.value.addTrack(screenVideoTrack);

                isSharingScreen.value = true;
            }
        } catch (error) {
            console.error(
                `useScreenCapture Error: ${(error as Error).message}`
            );
        }
    }

    function stop() {
        isSharingScreen.value = false;

        if (!sourceStream.value) {
            return;
        }

        if (screenStream) {
            for (const track of screenStream.getVideoTracks()) {
                sourceStream.value.removeTrack(track);

                track.stop();
            }

            screenStream = null;
        }

        if (sourceVideoTrack && screenVideoTrack) {
            sourceStream.value.removeTrack(screenVideoTrack);
            sourceStream.value.addTrack(sourceVideoTrack);

            sourceVideoTrack = null;
            screenVideoTrack = null;
        }
    }

    onBeforeUnmount(stop);

    return {
        isSharingScreen,
        start,
        stop
    };
}
