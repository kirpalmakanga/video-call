<script setup lang="ts">
import type Icon from './Icon.vue';

interface SelectItem {
    label: string;
    value: unknown;
}

defineProps<{ items: SelectItem[] }>();

const model = defineModel<SelectItem['value']>();
</script>

<template>
    <span class="relative w-full">
        <select
            class="bg-gray-700 text-gray-100 p-2 mt-4 w-full"
            v-model="model"
        >
            <option
                v-for="{ label, value } of items"
                :key="label"
                :value="value"
            >
                {{ label }}
            </option>
        </select>
    </span>
</template>
