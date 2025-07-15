import { reactive, toRefs, watch } from 'vue';
import { getStorageItem, setStorageItem } from '../../utils/storage';

interface State {
    displayName: string;
    isAudioEnabled: boolean;
    audioDeviceId: string;
    isVideoEnabled: string;
    videoDeviceId: string;
}

const state = reactive<State>(
    getStorageItem('settings') || {
        displayName: '',
        isAudioEnabled: true,
        audioDeviceId: '',
        isVideoEnabled: true,
        videoDeviceId: ''
    }
);

watch(state, () => {
    setStorageItem('settings', state);
});

export function useSettingsStore() {
    return {
        ...toRefs(state)
    };
}
