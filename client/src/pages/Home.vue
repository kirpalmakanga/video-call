<script setup lang="ts">
import { computed, ref } from 'vue';
import Placeholder from '../components/base/Placeholder.vue';
import RoomsGrid from '../components/RoomsGrid.vue';
import RoomsGridSkeleton from '../components/RoomsGridSkeleton.vue';
import { useRoomsListQuery } from '../utils/queries';

const { data: rooms, isLoading } = useRoomsListQuery();

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
        <div class="md:rounded p-4 w-full">
            <h1 class="font-bold text-neutral-100 mb-4">Available rooms</h1>

            <RoomsGridSkeleton v-if="isLoading" />

            <template v-else-if="rooms?.length">
                <SearchForm
                    class="bg-gray-900 p-4 rounded mb-4"
                    label="Find a room"
                    v-model="filter"
                />

                <RoomsGrid :items="currentRooms" />
            </template>

            <Placeholder
                v-else
                class="bg-slate-700 text-neutral-100 rounded"
                icon="i-mdi-format-list-bulleted"
                text="No available rooms."
            />
        </div>
    </div>
</template>
