<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useDevicesList } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import SettingsSkeleton from './MediaSettingsSkeleton.vue';
import AudioPreview from '../base/AudioPreview.vue';
import VideoPreview from '../base/VideoPreview.vue';
import { useMediaSettingsStore } from '../../composables/store/use-media-settings-store';

const mediaSettingsStore = useMediaSettingsStore();
const { audioDeviceId, videoDeviceId, isAudioEnabled, isVideoEnabled } =
    storeToRefs(mediaSettingsStore);

const { permissionGranted, videoInputs, audioInputs, ensurePermissions } =
    useDevicesList({
        requestPermissions: true
    });

const isAwaitingPermissions = ref<boolean>(true);

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

onMounted(async () => {
    await ensurePermissions();

    isAwaitingPermissions.value = false;
});
</script>

<template>
    <SettingsSkeleton v-if="isAwaitingPermissions" />

    <div
        v-else-if="permissionGranted"
        class="relative flex flex-col gap-4 text-gray-100"
    >
        <UFormField label="Camera" :ui="{ label: 'font-bold' }">
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

        <UFormField label="Microphone" :ui="{ label: 'font-bold' }">
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
        color="error"
        icon="i-mdi-warning-outline"
        description="Couldn't get access to camera and microphone. Please check your permissions."
    />
</template>
