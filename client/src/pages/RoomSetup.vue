<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import Placeholder from '../components/base/Placeholder.vue';
import MediaSettings from '../components/room/MediaSettings.vue';
import MediaSettingsSkeleton from '../components/room/MediaSettingsSkeleton.vue';
import PageError from '../components/page/PageError.vue';
import { useRoomQuery } from '../services/queries';
import { useMediaSettingsStore } from '../composables/store/use-media-settings-store';
import { storeToRefs } from 'pinia';

const {
    params: { roomId }
} = useRoute();
const router = useRouter();

const {
    data: room,
    isLoading,
    error,
    refetch
} = useRoomQuery(roomId as string);

const mediaSettingsStore = useMediaSettingsStore();
const { audioDeviceId, videoDeviceId } = storeToRefs(mediaSettingsStore);
</script>

<template>
    <div class="flex flex-col md:justify-center md:items-center grow p-4">
        <div
            v-if="isLoading"
            class="w-full md:w-md bg-gray-900 rounded p-4 shadow"
        >
            <USkeleton class="h-8 w-full mb-4" />

            <USkeleton class="h-5 w-full mb-4" />

            <MediaSettingsSkeleton />

            <div class="flex gap-2 mt-4 justify-center">
                <USkeleton class="h-8 w-20" />

                <USkeleton class="h-8 w-20" />
            </div>
        </div>

        <PageError v-else-if="error" @reload="refetch" />

        <div
            v-else-if="room"
            class="w-full md:w-md bg-gray-900 rounded p-4 shadow"
        >
            <h1 class="text-xl font-bold mb-4">{{ room.name }}</h1>

            <p class="mb-4 text-sm">
                Verify your camera and microphone setup before joining the room.
            </p>

            <MediaSettings />

            <div class="flex gap-2 mt-4 justify-center">
                <UButton
                    icon="i-mdi-phone"
                    @click="router.replace(`/room/${roomId}`)"
                    :disabled="!audioDeviceId || !videoDeviceId"
                >
                    Start
                </UButton>

                <UButton
                    color="error"
                    icon="i-mdi-phone-off"
                    @click="router.replace('/')"
                >
                    Leave
                </UButton>
            </div>
        </div>

        <Placeholder
            v-else
            class="bg-slate-700 text-neutral-100 rounded"
            icon="i-mdi-alert-circle"
            text="Room not found."
        />
    </div>
</template>
