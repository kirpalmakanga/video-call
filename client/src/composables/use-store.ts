import { reactive, toRefs, watchEffect } from 'vue';
import { getStorageItem, setStorageItem } from '../utils/storage';

interface State {
    audioDeviceId: string;
    videoDeviceId: string;
}

const state = reactive<State>({
    audioDeviceId: getStorageItem('audioDeviceId') || null,
    videoDeviceId: getStorageItem('videoDeviceId') || null
});

export function useStore() {
    watchEffect(() => {
        setStorageItem('videoDeviceId', state.videoDeviceId);

        setStorageItem('audioDeviceId', state.audioDeviceId);
    });

    return {
        ...toRefs(state)
    };
}
