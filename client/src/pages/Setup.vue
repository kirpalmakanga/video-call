<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import Settings from '../components/Settings.vue';
import { useSettingsStore } from '../composables/store/use-settings-store';
import { onMounted, ref } from 'vue';
import axios from 'axios';
import Placeholder from '../components/base/Placeholder.vue';
import { useRoomQuery } from '../utils/queries';

const {
    params: { roomId }
} = useRoute();
const router = useRouter();

const { isVideoEnabled, isAudioEnabled } = useSettingsStore();

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

            <div class="flex gap-2 mt-4 justify-between">
                <div class="flex gap-2">
                    <UButtonGroup>
                        <UTooltip
                            :text="
                                isVideoEnabled
                                    ? 'Turn camera off'
                                    : 'Toggle camera on'
                            "
                        >
                            <UButton
                                color="neutral"
                                @click="isVideoEnabled = !isVideoEnabled"
                            >
                                <UIcon
                                    class="size-5"
                                    :name="
                                        isVideoEnabled
                                            ? 'i-mdi-video'
                                            : 'i-mdi-video-off'
                                    "
                                />
                            </UButton>
                        </UTooltip>
                        <UTooltip
                            :text="
                                isAudioEnabled
                                    ? 'Disable microphone'
                                    : 'Enable microphone'
                            "
                        >
                            <UButton
                                color="neutral"
                                @click="isAudioEnabled = !isAudioEnabled"
                            >
                                <UIcon
                                    class="size-5"
                                    :name="
                                        isAudioEnabled
                                            ? 'i-mdi-microphone'
                                            : 'i-mdi-microphone-off'
                                    "
                                />
                            </UButton>
                        </UTooltip>
                    </UButtonGroup>
                </div>

                <UButton
                    icon="i-mdi-phone"
                    @click="router.replace(`/room/${roomId}`)"
                >
                    Start
                </UButton>
            </div>
        </template>

        <Placeholder v-else icon="i-mdi-alert-circle" text="Room not found." />
    </div>
</template>
