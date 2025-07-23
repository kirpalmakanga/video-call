<script setup lang="ts">
import { computed, watch } from 'vue';
import AudioPreview from './base/AudioPreview.vue';
import VideoPreview from './base/VideoPreview.vue';
import { useSettingsStore } from '../composables/store/use-settings-store';
import { useDevicesList } from '@vueuse/core';

const { audioDeviceId, videoDeviceId, isAudioEnabled, isVideoEnabled } =
    useSettingsStore();

const { permissionGranted, videoInputs, audioInputs } = useDevicesList({
    requestPermissions: true
});

const videoDeviceSelectItems = computed(() =>
    videoInputs.value.map(({ label, deviceId: value }) => ({ label, value }))
);

const audioDeviceSelectItems = computed(() =>
    audioInputs.value.map(({ label, deviceId: value }) => ({ label, value }))
);

function handleAudioDevicesListChange() {
    if (
        !audioInputs.value.some(
            ({ deviceId }) => deviceId === audioDeviceId.value
        )
    ) {
        audioDeviceId.value = audioInputs.value[0]?.deviceId || '';
    }
}

function handleVideoDevicesListChange() {
    if (
        !videoInputs.value.some(
            ({ deviceId }) => deviceId === videoDeviceId.value
        )
    ) {
        videoDeviceId.value = videoInputs.value[0]?.deviceId || '';
    }
}

watch(audioInputs, handleAudioDevicesListChange);
watch(videoInputs, handleVideoDevicesListChange);
</script>

<template>
    <div
        v-if="permissionGranted"
        class="relative flex flex-col gap-4 text-gray-100"
    >
        <UFormField>
            <VideoPreview class="rounded" :device-id="videoDeviceId" />

            <USelect
                class="w-full mt-2"
                variant="soft"
                size="lg"
                icon="i-mdi-camera"
                :items="videoDeviceSelectItems"
                :disabled="!videoInputs.length"
                v-model="videoDeviceId"
            />
        </UFormField>

        <UFormField>
            <AudioPreview :device-id="audioDeviceId" />

            <USelect
                class="w-full mt-2"
                variant="soft"
                size="lg"
                icon="i-mdi-microphone"
                :items="audioDeviceSelectItems"
                :disabled="!audioInputs.length"
                v-model="audioDeviceId"
            />
        </UFormField>
    </div>

    <UAlert
        v-else
        color="info"
        icon="i-mdi-information-outline"
        description="Awaiting media permissions."
    />
</template>
