<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Placeholder from '../components/base/Placeholder.vue';
import RoomsGrid from '../components/RoomsGrid.vue';
import RoomsGridSkeleton from '../components/RoomsGridSkeleton.vue';
import { useSocket } from '../composables/use-socket';
import { useRoomsListQuery } from '../utils/queries';

const { emit, subscribe } = useSocket();

const { data: rooms, isLoading } = useRoomsListQuery();

const userCounts = ref<Record<string, number>>({});

function onUserCountsSynced(data: Record<string, number>) {
    userCounts.value = data;
}

onMounted(() => {
    subscribe('syncUserCounts', onUserCountsSynced);

    emit('joinUserCounts');
});

onBeforeUnmount(() => emit('leaveUserCounts'));
</script>

<template>
    <div class="flex grow md:justify-center">
        <div class="md:rounded p-4 w-full">
            <p class="text-neutral-100 mb-4">Available rooms</p>

            <RoomsGridSkeleton v-if="isLoading" />

            <RoomsGrid
                v-else-if="rooms?.length"
                :rooms="rooms"
                :user-counts="userCounts"
            />

            <Placeholder
                v-else
                class="bg-slate-700 text-neutral-100 rounded"
                icon="i-mdi-format-list-bulleted"
                text="No available rooms."
            />
        </div>
    </div>
</template>
