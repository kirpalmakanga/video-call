<script setup lang="ts">
import { useRoomsListQuery } from '../../services/queries';
import SearchableRoomsGrid from './SearchableRoomsGrid.vue';

const { data, isLoading, isPending, error, refetch } = useRoomsListQuery();
</script>

<template>
    <SearchableRoomsGrid
        :items="data || []"
        :is-pending="isPending"
        :is-loading="isLoading"
        :has-error="!!error"
        @reload="refetch"
    />
</template>
