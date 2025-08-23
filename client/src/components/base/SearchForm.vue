<script setup lang="ts">
defineProps<{ label?: string }>();

const model = defineModel<string>();
</script>

<template>
    <UFormField :label="label">
        <UInput
            class="w-full"
            variant="soft"
            placeholder="Room name"
            v-model="model"
        />
    </UFormField>
</template>
