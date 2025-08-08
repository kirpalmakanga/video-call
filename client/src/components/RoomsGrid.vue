<script setup lang="ts">
import RoomsGridItem from './RoomsGridItem.vue';

defineProps<{ rooms: Room[] }>();
</script>

<template>
    <ul
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
        <li v-for="{ id, name } of rooms">
            <RoomsGridItem :id="id" :name="name" />
        </li>
    </ul>
</template>
