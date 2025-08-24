<script setup lang="ts">
import { useFavoriteRoomsQuery } from '../../services/queries';
import SearchableRoomsGrid from './SearchableRoomsGrid.vue';

const { data, isLoading, error, refetch } = useFavoriteRoomsQuery();
</script>

<template>
    <SearchableRoomsGrid
        :items="data || []"
        :is-loading="isLoading"
        :has-error="!!error"
        @reload="refetch"
    />
</template>
