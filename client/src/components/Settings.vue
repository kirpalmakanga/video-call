<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import Button from './base/Button.vue';
import Dropdown from './base/Dropdown.vue';
import Icon from './base/Icon.vue';
import LoadingIcon from './base/LoadingIcon.vue';
import ScrollContainer from './base/ScrollContainer.vue';
import SlidePanel from './base/SlidePanel.vue';
import AudioPreview from './base/AudioPreview.vue';
import VideoPreview from './base/VideoPreview.vue';
import { closeStream, getAvailableDevices, getStream } from '../utils/media';
import { useStore } from '../composables/use-store';

const { audioDeviceId, videoDeviceId } = useStore();

interface Props {
    isVisible: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{ close: [e: void] }>();

interface Device {
    id: string;
    label: string;
}

interface State {
    isLoading: boolean;
    videoDevices: Device[];
    audioDevices: Device[];
    stream: MediaStream | null;
}

const state = reactive<State>({
    isLoading: false,
    videoDevices: [],
    audioDevices: [],
    stream: null
});

const videoDeviceSelectItems = computed(() =>
    state.videoDevices.map(({ label, id: value }) => ({ label, value }))
);

const audioDeviceSelectItems = computed(() =>
    state.audioDevices.map(({ label, id: value }) => ({ label, value }))
);

function removeStream() {
    if (state.stream) {
        closeStream(state.stream);

        state.stream = null;
    }
}

async function openStream() {
    try {
        if (!state.stream) {
            state.stream = await getStream({ audio: true, video: true });
        }
    } catch (error) {
        console.error(error);
    }
}

function setDefaultVideoDeviceId() {
    if (videoDeviceId.value) {
        return;
    }

    const [{ id } = { id: null }] = state.videoDevices;

    if (id) {
        videoDeviceId.value = id;
    }
}

function setDefaultAudioDeviceId() {
    if (audioDeviceId.value) {
        return;
    }

    const [{ id } = { id: null }] = state.audioDevices;

    if (id) {
        audioDeviceId.value = id;
    }
}

async function fetchDevices() {
    const [videoDevices, audioDevices] = await Promise.all([
        getAvailableDevices('video'),
        getAvailableDevices('audio')
    ]);

    Object.assign(state, {
        videoDevices,
        audioDevices
    });
}

async function loadSettings() {
    if (state.isLoading) {
        return;
    }

    state.isLoading = true;

    await openStream();
    await fetchDevices();

    setDefaultVideoDeviceId();
    setDefaultAudioDeviceId();

    state.isLoading = false;
}

function onVisibilityChange(isVisible: boolean) {
    if (props.isVisible) {
        loadSettings();
    } else {
        removeStream();
    }
}

watch(() => props.isVisible, onVisibilityChange);

onBeforeUnmount(removeStream);
</script>

<template>
    <SlidePanel title="Settings" :is-visible="isVisible" @close="emit('close')">
        <template v-if="isVisible">
            <ScrollContainer class="flex-grow">
                <div
                    class="relative flex flex-col flex-grow gap-8 text-gray-100"
                >
                    <div class="flex flex-col">
                        <h2 class="font-bold mb-2 flex items-center">
                            <Icon class="w-5 h-5 mr-2" name="camera" />
                            Camera
                        </h2>

                        <VideoPreview :device-id="videoDeviceId" />

                        <Dropdown
                            :items="videoDeviceSelectItems"
                            :disabled="!state.videoDevices.length"
                            v-model="videoDeviceId"
                        />

                        <p
                            v-if="!state.videoDevices.length"
                            class="bg-red-500 p-4 mt-4"
                        >
                            No camera found. Check if it is plugged in and you
                            gave the proper permissions then refresh.
                        </p>
                    </div>

                    <div class="flex flex-col">
                        <h2 class="font-bold mb-2 flex items-center">
                            <Icon class="w-5 h-5 mr-2" name="microphone" />
                            Microphone
                        </h2>

                        <AudioPreview :device-id="audioDeviceId" />

                        <Dropdown
                            :items="audioDeviceSelectItems"
                            :disabled="!state.audioDevices.length"
                            v-model="audioDeviceId"
                        />

                        <p
                            v-if="!state.audioDevices.length"
                            class="bg-red-500 p-4 mt-4"
                        >
                            No microphone found. Check if it is plugged in and
                            you gave the proper permissions then refresh.
                        </p>
                    </div>

                    <Transition name="fade" mode="out-in">
                        <div
                            v-if="state.isLoading"
                            class="absolute inset-0 bg-gray-900 flex justify-center"
                        >
                            <LoadingIcon class="w-6 h-6 text-gray-100" />
                        </div>
                    </Transition>
                </div>
            </ScrollContainer>

            <div class="flex justify-end gap-4 mt-8">
                <Button @click="loadSettings" :disabled="state.isLoading">
                    Refresh devices
                </Button>

                <Button @click="emit('close')">Done</Button>
            </div>
        </template>
    </SlidePanel>
</template>
