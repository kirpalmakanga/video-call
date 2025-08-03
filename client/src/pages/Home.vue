<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import Placeholder from '../components/base/Placeholder.vue';
import RoomsGrid from '../components/RoomsGrid.vue';
import { useSocket } from '../composables/use-socket';
import { useRoomsListQuery } from '../utils/queries';
import RoomsGridSkeleton from '../components/RoomsGridSkeleton.vue';

const { subscribe, unsubscribe } = useSocket();

const { data: rooms, isLoading } = useRoomsListQuery();

function onRoomsListSync({ items }: { items: ClientRoom[] }) {
    rooms.value = items;
}

onMounted(() => subscribe('roomsListSync', onRoomsListSync));

onBeforeUnmount(() => unsubscribe('roomsListSync', onRoomsListSync));

Placeholder;
</script>

<template>
    <div class="flex grow md:justify-center">
        <div class="md:rounded p-4 w-full">
            <p class="text-neutral-100 mb-4">Available rooms</p>

            <RoomsGridSkeleton v-if="isLoading" />

            <RoomsGrid v-else-if="rooms?.length" :rooms="rooms" />

            <Placeholder
                v-else
                class="bg-slate-700 text-neutral-100 rounded"
                icon="i-mdi-format-list-bulleted"
                text="No available rooms."
            />
        </div>
    </div>
</template>
