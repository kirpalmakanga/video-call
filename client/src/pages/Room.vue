<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Placeholder from '../components/base/Placeholder.vue';
import Settings from '../components/Settings.vue';
import Participant from '../components/room/Participant.vue';
import AutoGrid from '../components/base/AutoGrid.vue';
import { useRoom } from '../composables/use-room';
import { useSettingsStore } from '../composables/store/use-settings-store';
import { useRoomQuery } from '../utils/queries';
import { useFullscreen } from '@vueuse/core';

const viewModeIcons = {
    grid: 'i-mdi-view-grid',
    sidebar: 'i-mdi-dock-right'
};

type ViewMode = 'sidebar' | 'grid';

interface State {
    viewMode: ViewMode;
    areSettingsVisible: boolean;
    activeParticipantId: string | null;
}

const router = useRouter();

const {
    params: { roomId }
} = useRoute();

const { data: room, isLoading } = useRoomQuery(roomId as string);

const { isVideoEnabled, isAudioEnabled, videoDeviceId, audioDeviceId } =
    useSettingsStore();

const state = reactive<State>({
    viewMode: 'sidebar',
    areSettingsVisible: false,
    activeParticipantId: null
});

const { participants, toggleMuteParticipant, connect, disconnect } = useRoom(
    roomId as string,
    {
        displayName: 'User',
        streamConfig: computed(() => ({
            video: {
                deviceId: videoDeviceId.value
            },
            audio: {
                deviceId: audioDeviceId.value
            }
        })),
        isVideoEnabled,
        isAudioEnabled
    }
);

const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

const activeParticipant = computed(() => {
    return participants.value.find(
        ({ id }) => id === state.activeParticipantId
    );
});

function toggleSettings() {
    state.areSettingsVisible = !state.areSettingsVisible;
}

function isViewMode(mode: ViewMode) {
    return state.viewMode === mode;
}

function toggleViewMode() {
    state.viewMode = isViewMode('grid') ? 'sidebar' : 'grid';
}

function isActiveParticipant(id: string) {
    return id === state.activeParticipantId;
}

function setActiveParticipant(id: string | null) {
    state.activeParticipantId = id;
}

function leaveRoom() {
    router.push('/');
}

watch([audioDeviceId, videoDeviceId], ([audio, video]) => {
    if (audio && video) {
        connect();
    }
});

watch(
    () => participants.value.length,
    (count) => {
        if (count < 2) {
            setActiveParticipant(null);

            return;
        }

        const lastParticipant = participants.value.at(-1);

        if (
            lastParticipant &&
            lastParticipant.id !== state.activeParticipantId
        ) {
            setActiveParticipant(lastParticipant.id);
        }
    }
);

onMounted(() => {
    if (audioDeviceId.value && videoDeviceId.value) {
        connect();
    } else {
        toggleSettings();
    }
});

onBeforeUnmount(disconnect);
</script>

<template>
    <section class="flex flex-col grow gap-4 p-4">
        <template v-if="isLoading">
            <USkeleton class="grow" />

            <div class="flex justify-between">
                <USkeleton class="h-8 w-29" />

                <div class="flex gap-4">
                    <USkeleton class="h-8 w-10" />
                    <USkeleton class="h-8 w-10" />
                </div>
            </div>
        </template>

        <template v-else-if="room">
            <h1 class="text-2xl">{{ room.name }}</h1>

            <div class="relative flex grow gap-4">
                <div
                    v-if="isViewMode('sidebar')"
                    class="flex flex-col grow gap-4 bg-neutral-800 bg p-4 rounded"
                >
                    <Participant
                        v-if="activeParticipant"
                        v-bind="activeParticipant"
                        :is-active-participant="true"
                        @toggle-mute="
                            toggleMuteParticipant(activeParticipant.id)
                        "
                    />

                    <Placeholder
                        v-else
                        class="grow text-gray-100 rounded"
                        icon="i-mdi-video"
                        text="Awaiting participants..."
                    />
                </div>

                <div
                    v-if="isViewMode('sidebar')"
                    class="w-64 relative h-full overflow-y-auto bg-neutral-700 p-4 rounded"
                >
                    <ul class="flex flex-col gap-4">
                        <template
                            v-for="{ id, ...participant } of participants"
                            :key="id"
                        >
                            <li :class="{ hidden: isActiveParticipant(id) }">
                                <Participant
                                    v-bind="participant"
                                    :use-content-ratio="true"
                                    @toggle-mute="toggleMuteParticipant(id)"
                                    @click="
                                        participants.length > 1 &&
                                            setActiveParticipant(id)
                                    "
                                />
                            </li>
                        </template>
                    </ul>
                </div>

                <div
                    v-else-if="isViewMode('grid')"
                    class="flex grow bg-neutral-800 p-4 rounded"
                >
                    <AutoGrid
                        class="grow"
                        :items="participants"
                        :item-key="id"
                        :item-aspect-ratio="16 / 9"
                    >
                        <template #item="{ id, ...participant }">
                            <Participant
                                v-bind="participant"
                                @toggle-mute="toggleMuteParticipant(id)"
                            />
                        </template>
                    </AutoGrid>
                </div>
            </div>

            <div class="flex justify-between items-end gap-4">
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
                    <UTooltip
                        :text="
                            state.viewMode === 'sidebar'
                                ? 'Switch to grid layout'
                                : 'Switch to sidebar layout'
                        "
                    >
                        <UButton color="neutral" @click="toggleViewMode">
                            <UIcon
                                class="size-5"
                                :name="viewModeIcons[state.viewMode]"
                            />
                        </UButton>
                    </UTooltip>
                </UButtonGroup>

                <div class="flex gap-4">
                    <UTooltip text="Settings">
                        <UButton color="neutral" @click="toggleFullscreen">
                            <UIcon
                                class="size-5"
                                :name="
                                    isFullscreen
                                        ? 'i-mdi-fullscreen'
                                        : 'i-mdi-fullscreen-exit'
                                "
                            />
                        </UButton>
                    </UTooltip>
                    <UTooltip text="Settings">
                        <UButton color="neutral" @click="toggleSettings">
                            <UIcon class="size-5" name="i-mdi-cog" />
                        </UButton>
                    </UTooltip>
                    <UTooltip text="Leave room">
                        <UButton color="error" @click="leaveRoom">
                            <UIcon class="size-5" name="i-mdi-phone-off" />
                        </UButton>
                    </UTooltip>
                </div>
            </div>

            <USlideover
                title="Settings"
                v-model:open="state.areSettingsVisible"
                :ui="{ body: 'flex flex-col' }"
            >
                <template #body>
                    <ScrollContainer class="grow">
                        <Settings />
                    </ScrollContainer>
                </template>
            </USlideover>
        </template>

        <Placeholder
            v-else
            class="grow bg-slate-700 text-neutral-100 rounded"
            icon="i-mdi-alert-circle"
            text="Room not found."
        />
    </section>
</template>
