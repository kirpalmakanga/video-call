import { reactive, toRefs } from 'vue';
import { defineStore } from 'pinia';

interface State {
    isAudioEnabled: boolean;
    audioDeviceId: string;
    isVideoEnabled: boolean;
    videoDeviceId: string;
    microphoneVolume: number;
}

function getInitialState(): State {
    return {
        isAudioEnabled: true,
        audioDeviceId: '',
        isVideoEnabled: true,
        videoDeviceId: '',
        microphoneVolume: 100
    };
}

export const useMediaSettingsStore = defineStore(
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
