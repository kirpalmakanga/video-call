import { reactive, toRefs, watch } from 'vue';
import { getStorageItem, setStorageItem } from '../../utils/storage';

interface State {
    isAudioEnabled: boolean;
    audioDeviceId: string;
    isVideoEnabled: boolean;
    videoDeviceId: string;
}

function getInitialState(): State {
    return {
        isAudioEnabled: true,
        audioDeviceId: '',
        isVideoEnabled: true,
        videoDeviceId: ''
    };
}

const state = reactive<State>({
    ...getInitialState(),
    ...(getStorageItem('settings') || {})
});

watch(state, () => {
    setStorageItem('settings', state);
});

export function useSettingsStore() {
    return {
        ...toRefs(state)
    };
}
