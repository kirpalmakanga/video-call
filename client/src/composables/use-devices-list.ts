import { computed, onBeforeUnmount, onMounted, reactive, toRefs } from 'vue';
import {
    closeStream,
    createStream,
    getAvailableDevices,
    subscribeToDeviceChange
} from '../utils/media';

interface Options {
    audio: boolean;
    video: boolean;
}

interface State {
    isLoading: boolean;
    isRefreshing: boolean;
    items: MediaDeviceInfo[];
}

type MediaDeviceKind = 'audioinput' | 'videoinput';

export function useMediaDevices(options: Options) {
    const state = reactive<State>({
        isLoading: true,
        isRefreshing: false,
        items: []
    });

    async function fetchDevices() {
        try {
            if (state.items.length) state.isRefreshing = true;
            else state.isLoading = true;

            const stream = await createStream(options);

            state.items = await getAvailableDevices();

            closeStream(stream);
        } finally {
            state.isLoading = false;

            if (state.isRefreshing) state.isRefreshing = false;
        }
    }

    function getDevicesByKind(targetKind: MediaDeviceKind) {
        return state.items.reduce((arr, { deviceId: id, label, kind }) => {
            if (kind === targetKind) {
                arr.push({ id, label });
            }

            return arr;
        }, [] as Device[]);
    }

    const unsubscribeFromDeviceChange = subscribeToDeviceChange(fetchDevices);

    onMounted(fetchDevices);

    onBeforeUnmount(unsubscribeFromDeviceChange);

    return {
        ...toRefs(state),
        audioInputs: computed(() =>
            options.audio ? getDevicesByKind('audioinput') : []
        ),
        videoInputs: computed(() =>
            options.video ? getDevicesByKind('videoinput') : []
        ),
        refetch() {
            fetchDevices();
        }
    };
}
