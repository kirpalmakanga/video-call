<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import Placeholder from '../components/base/Placeholder.vue';
import Settings from '../components/Settings.vue';
import { useRoomQuery } from '../utils/queries';

const {
    params: { roomId }
} = useRoute();
const router = useRouter();

const { data: room, isLoading } = useRoomQuery(roomId as string);
</script>

<template>
    <div class="flex flex-col justify-center grow w-1/2 mx-auto p-4">
        <template v-if="isLoading">
            <USkeleton class="h-8 w-full mb-4" />

            <USkeleton class="h-6 w-full mb-4" />

            <USkeleton class="w-full aspect-video" />

            <USkeleton class="h-8 w-full mt-2 mb-4" />
            <USkeleton class="h-2 w-full mt-2" />

            <USkeleton class="h-8 w-full mt-2 mb-4" />

            <div class="flex justify-between">
                <USkeleton class="h-8 w-20" />

                <USkeleton class="h-8 w-20" />
            </div>
        </template>

        <template v-else-if="room">
            <h1 class="text-2xl font-bold mb-4">{{ room.name }}</h1>

            <p class="mb-4">
                Verify your camera and microphone setup before joining the room.
            </p>

            <Settings />

            <div class="flex gap-2 mt-4 justify-center">
                <UButton
                    icon="i-mdi-phone"
                    @click="router.replace(`/room/${roomId}`)"
                >
                    Start
                </UButton>
            </div>
        </template>

        <Placeholder
            v-else
            class="bg-slate-700 text-neutral-100 rounded"
            icon="i-mdi-alert-circle"
            text="Room not found."
        />
    </div>
</template>
