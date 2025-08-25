<script setup lang="ts">
import { computed, ref } from 'vue';
import SearchForm from '../base/SearchForm.vue';
import RoomsGrid from './RoomsGrid.vue';

const props = defineProps<{
    isPending: boolean;
    isLoading: boolean;
    hasError: boolean;
    items: Room[];
}>();

const emit = defineEmits<{ reload: [e: void] }>();

const search = ref<string>('');

const currentItems = computed<Room[]>(() => {
    const { items } = props;

    if (search.value) {
        return items.filter(({ name }: Room) => {
            return name.toLowerCase().includes(search.value.toLowerCase());
        });
    }

    return items;
});
</script>

<template>
    <SearchForm
        class="bg-gray-900 p-4 rounded mb-4"
        label="Find a room"
        v-model="search"
    />

    <RoomsGridSkeleton v-if="isPending" />

    <PageError v-else-if="hasError" @reload="emit('reload')" />

    <RoomsGrid v-else-if="currentItems.length" :items="currentItems" />

    <Placeholder
        v-else
        class="bg-slate-700 text-neutral-100 rounded"
        icon="i-mdi-format-list-bulleted"
        :text="search ? 'No results.' : 'No available rooms.'"
    />
</template>
