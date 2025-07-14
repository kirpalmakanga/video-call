<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';
import Loader from './base/Loader.vue';
import ScrollContainer from './base/ScrollContainer.vue';
import AudioPreview from './base/AudioPreview.vue';
import VideoPreview from './base/VideoPreview.vue';
import { getAvailableDevices } from '../utils/media';
import { useSettingsStore } from '../composables/store/use-settings-store';
import { useMediaStream } from '../composables/use-media-stream';

const { displayName, audioDeviceId, videoDeviceId } = useSettingsStore();

const emit = defineEmits<{ close: [e: void] }>();

interface Device {
    id: string;
    label: string;
}

interface State {
    isLoading: boolean;
    videoDevices: Device[];
    audioDevices: Device[];
}

const { enableStream, disableStream } = useMediaStream();

const state = reactive<State>({
    isLoading: false,
    videoDevices: [],
    audioDevices: []
});

const videoDeviceSelectItems = computed(() =>
    state.videoDevices.map(({ label, id: value }) => ({ label, value }))
);

const audioDeviceSelectItems = computed(() =>
    state.audioDevices.map(({ label, id: value }) => ({ label, value }))
);

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

    await enableStream({ audio: true, video: true });

    await fetchDevices();

    setDefaultVideoDeviceId();
    setDefaultAudioDeviceId();

    state.isLoading = false;
}

onMounted(loadSettings);

onBeforeUnmount(disableStream);
</script>

<template>
    <ScrollContainer class="grow">
        <div class="relative flex flex-col grow gap-8 text-gray-100">
            <UFormField label="Display name">
                <UInput
                    class="w-full"
                    variant="soft"
                    size="lg"
                    v-model="displayName"
                />
            </UFormField>

            <UFormField label="Camera">
                <VideoPreview class="rounded" :device-id="videoDeviceId" />

                <USelect
                    class="w-full mt-2"
                    variant="soft"
                    size="lg"
                    :items="videoDeviceSelectItems"
                    :disabled="!state.videoDevices.length"
                    v-model="videoDeviceId"
                />

                <UAlert
                    v-if="!state.videoDevices.length"
                    class="mt-4"
                    color="error"
                    description="
                    No camera found. Check if it is plugged in and you gave the
                    proper permissions then refresh."
                />
            </UFormField>

            <UFormField label="Microphone">
                <AudioPreview :device-id="audioDeviceId" />

                <USelect
                    class="w-full mt-2"
                    variant="soft"
                    size="lg"
                    :items="audioDeviceSelectItems"
                    :disabled="!state.audioDevices.length"
                    v-model="audioDeviceId"
                />

                <UAlert
                    v-if="!state.audioDevices.length"
                    class="mt-2"
                    color="error"
                    description="No microphone found. Check if it is plugged in and you gave the proper permissions then refresh."
                />
            </UFormField>

            <Transition name="fade" mode="out-in">
                <div
                    v-if="state.isLoading"
                    class="absolute inset-0 bg-gray-900 flex justify-center"
                >
                    <Loader class="w-6 h-6 text-gray-100" />
                </div>
            </Transition>
        </div>
    </ScrollContainer>

    <div class="flex justify-end gap-4 mt-8">
        <UButton @click="loadSettings" :disabled="state.isLoading">
            Refresh devices
        </UButton>

        <UButton @click="emit('close')">Done</UButton>
    </div>
</template>
