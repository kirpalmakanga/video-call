<script setup lang="ts">
import { useCreatedRoomsQuery } from '../../services/queries';
import SearchableRoomsGrid from './SearchableRoomsGrid.vue';

const { data, isLoading, error, refetch } = useCreatedRoomsQuery();
</script>

<template>
    <SearchableRoomsGrid
        :items="data || []"
        :is-loading="isLoading"
        :has-error="!!error"
        @reload="refetch"
    />
</template>
