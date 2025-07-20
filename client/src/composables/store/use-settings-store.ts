import { reactive, toRefs, watch } from 'vue';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { useStorage } from '@vueuse/core';

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

const storedState = useStorage<State>('settings', getInitialState());

const state = reactive<State>(storedState.value);

watch(state, () => {
    storedState.value = state;
});

export function useSettingsStore() {
    return {
        ...toRefs(state)
    };
}
