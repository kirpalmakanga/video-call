<script setup lang="ts">
import { computed, ref } from 'vue';
import Placeholder from '../components/base/Placeholder.vue';
import RoomsGrid from '../components/RoomsGrid.vue';
import RoomsGridSkeleton from '../components/RoomsGridSkeleton.vue';
import { useRoomsListQuery } from '../services/queries';
import CreateRoomButton from '../components/CreateRoomButton.vue';
import PageError from '../components/page/PageError.vue';

const { data: rooms, isLoading, error, refetch } = useRoomsListQuery();

const filter = ref<string>('');

const currentRooms = computed(() => {
    if (!rooms.value) {
        return [];
    }

    if (filter.value) {
        return rooms.value.filter(({ name }) =>
            name.toLowerCase().includes(filter.value.toLowerCase())
        );
    }

    return rooms.value;
});
</script>

<template>
    <div class="flex grow md:justify-center">
        <div class="flex flex-col md:rounded p-4 w-full">
            <div class="flex items-center gap-2 mb-4">
                <h1 class="grow font-bold text-neutral-100">Available rooms</h1>

                <CreateRoomButton />
            </div>

            <SearchForm
                class="bg-gray-900 p-4 rounded mb-4"
                label="Find a room"
                v-model="filter"
            />

            <RoomsGridSkeleton v-if="isLoading" />

            <PageError v-else-if="error" @reload="refetch" />

            <RoomsGrid v-else-if="rooms?.length" :items="currentRooms" />

            <Placeholder
                v-else
                class="bg-slate-700 text-neutral-100 rounded"
                icon="i-mdi-format-list-bulleted"
                text="No available rooms."
            />
        </div>
    </div>
</template>
