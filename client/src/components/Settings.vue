<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import ScrollContainer from './base/ScrollContainer.vue';
import AudioPreview from './base/AudioPreview.vue';
import VideoPreview from './base/VideoPreview.vue';
import { useMediaDevices } from '../composables/use-devices-list';
import { useSettingsStore } from '../composables/store/use-settings-store';

const { audioDeviceId, videoDeviceId } = useSettingsStore();

const emit = defineEmits<{ close: [e: void] }>();

const { audioInputs, videoInputs, isLoading, isRefreshing, refetch } =
    useMediaDevices({ audio: true, video: true });

const videoDeviceSelectItems = computed(() =>
    videoInputs.value.map(({ label, id: value }) => ({ label, value }))
);

const audioDeviceSelectItems = computed(() =>
    audioInputs.value.map(({ label, id: value }) => ({ label, value }))
);

function handleAudioDevicesListChange() {
    if (!audioInputs.value.some(({ id }) => id === audioDeviceId.value)) {
        audioDeviceId.value = audioInputs.value[0]?.id || '';
    }
}

function handleVideoDevicesListChange() {
    if (!videoInputs.value.some(({ id }) => id === videoDeviceId.value)) {
        videoDeviceId.value = videoInputs.value[0]?.id || '';
    }
}

watch(audioInputs, handleAudioDevicesListChange);
watch(videoInputs, handleVideoDevicesListChange);
</script>

<template>
    <ScrollContainer class="grow">
        <div class="relative flex flex-col grow gap-8 text-gray-100">
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

                <UAlert
                    v-if="!isLoading && !videoInputs.length"
                    class="mt-4"
                    color="error"
                    description="
                    No camera found. Check if it is plugged in and you gave the
                    proper permissions then refresh."
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

                <UAlert
                    v-if="!isLoading && !audioInputs.length"
                    class="mt-2"
                    color="error"
                    description="No microphone found. Check if it is plugged in and you gave the proper permissions then refresh."
                />
            </UFormField>
        </div>
    </ScrollContainer>

    <div class="flex justify-end gap-4 mt-8">
        <UButton :disabled="isRefreshing" @click="refetch">
            <UIcon
                class="size-4"
                :class="{ 'animate-spin': isRefreshing }"
                name="i-mdi-sync"
            />
        </UButton>

        <UButton @click="emit('close')">Close</UButton>
    </div>
</template>
