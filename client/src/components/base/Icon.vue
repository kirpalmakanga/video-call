<script setup lang="ts">
defineProps<{ name: string }>();
</script>

<template>
    <span class="inline-flex flex-shrink-0 items-center justify-center">
        <svg class="h-full w-full fill-current">
            <use :href="`/icons.svg#icon-${name}`" />
        </svg>
    </span>
</template>
