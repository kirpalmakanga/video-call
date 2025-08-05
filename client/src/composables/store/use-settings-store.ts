import { reactive, toRefs, watch } from 'vue';
import { defineStore } from 'pinia';

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

export const useSettingsStore = defineStore(
    'settings',
    () => {
        const state = reactive<State>(getInitialState());

        return {
            ...toRefs(state),
            clearSettings() {
                Object.assign(state, getInitialState());
            }
        };
    },
    { persist: true }
);
