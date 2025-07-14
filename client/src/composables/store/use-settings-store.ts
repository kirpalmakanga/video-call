import { reactive, toRefs, watch } from 'vue';
import { getStorageItem, setStorageItem } from '../../utils/storage';

interface State {
    displayName: string;
    audioDeviceId: string;
    videoDeviceId: string;
}

const state = reactive<State>(
    getStorageItem('settings') || {
        displayName: '',
        audioDeviceId: '',
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
