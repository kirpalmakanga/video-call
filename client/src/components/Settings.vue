<script setup lang="ts">
import { computed, watch } from 'vue';
import ScrollContainer from './base/ScrollContainer.vue';
import AudioPreview from './base/AudioPreview.vue';
import VideoPreview from './base/VideoPreview.vue';
import { useSettingsStore } from '../composables/store/use-settings-store';
import { useDevicesList } from '@vueuse/core';

const { audioDeviceId, videoDeviceId } = useSettingsStore();

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
    <ScrollContainer class="grow">
        <div
            v-if="permissionGranted"
            class="relative flex flex-col grow gap-8 text-gray-100"
        >
            <UFormField
                label="Camera"
                :ui="{ label: 'flex gap-1 items-center' }"
            >
                <template #label="{ label }">
                    <UIcon class="size-6" name="i-mdi-video" />
                    {{ label }}
                </template>

                <VideoPreview class="rounded" :device-id="videoDeviceId" />

                <USelect
                    class="w-full mt-2"
                    variant="soft"
                    size="lg"
                    :loading="isLoading"
                    :items="videoDeviceSelectItems"
                    :disabled="!videoInputs.length"
                    v-model="videoDeviceId"
                />
            </UFormField>

            <UFormField
                label="Microphone"
                :ui="{ label: 'flex gap-1 items-center' }"
            >
                <template #label="{ label }">
                    <UIcon class="size-6" name="i-mdi-microphone" />
                    {{ label }}
                </template>

                <AudioPreview :device-id="audioDeviceId" />

                <USelect
                    class="w-full mt-2"
                    variant="soft"
                    size="lg"
                    :loading="isLoading"
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
    </ScrollContainer>
</template>
