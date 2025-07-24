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
        <UFormField label="Camera">
            <VideoPreview
                class="rounded"
                :is-enabled="isVideoEnabled"
                :device-id="videoDeviceId"
            />
            <div class="flex gap-2 items-center mt-2">
                <UTooltip
                    :text="
                        isVideoEnabled ? 'Turn camera off' : 'Toggle camera on'
                    "
                >
                    <UButton
                        variant="soft"
                        color="neutral"
                        :icon="
                            isVideoEnabled ? 'i-mdi-video' : 'i-mdi-video-off'
                        "
                        @click="isVideoEnabled = !isVideoEnabled"
                    />
                </UTooltip>

                <USelect
                    class="w-full"
                    variant="soft"
                    :items="videoDeviceSelectItems"
                    :disabled="!videoInputs.length"
                    v-model="videoDeviceId"
                />
            </div>
        </UFormField>

        <UFormField label="Microphone">
            <AudioPreview
                :is-enabled="isAudioEnabled"
                :device-id="audioDeviceId"
            />

            <div class="flex gap-2 items-center mt-2">
                <UTooltip
                    :text="
                        isAudioEnabled
                            ? 'Disable microphone'
                            : 'Enable microphone'
                    "
                >
                    <UButton
                        variant="soft"
                        color="neutral"
                        :icon="
                            isAudioEnabled
                                ? 'i-mdi-microphone'
                                : 'i-mdi-microphone-off'
                        "
                        @click="isAudioEnabled = !isAudioEnabled"
                    />
                </UTooltip>

                <USelect
                    class="w-full"
                    variant="soft"
                    :items="audioDeviceSelectItems"
                    :disabled="!audioInputs.length"
                    v-model="audioDeviceId"
                />
            </div>
        </UFormField>
    </div>

    <UAlert
        v-else
        color="info"
        icon="i-mdi-information-outline"
        description="Awaiting media permissions."
    />
</template>
