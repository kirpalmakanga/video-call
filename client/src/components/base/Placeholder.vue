<script setup lang="ts">
import Icon from './Icon.vue';
defineProps<{ icon: string; text: string }>();
</script>

<template>
    <div class="flex flex-col items-center justify-center p-4">
        <Icon class="w-12 h-12" :name="icon" />

        <p>{{ text }}</p>
    </div>
</template>
