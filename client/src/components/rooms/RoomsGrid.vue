<script setup lang="ts">
import RoomsGridItem from './RoomsGridItem.vue';

defineProps<{ items: Room[] }>();
</script>

<template>
    <ul
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
        <li v-for="item of items">
            <RoomsGridItem v-bind="item" />
        </li>
    </ul>
</template>
