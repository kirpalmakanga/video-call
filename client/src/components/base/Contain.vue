<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core';
import { ref, useTemplateRef, watch } from 'vue';

const props = defineProps<{ aspectRatio: number }>();

const container = useTemplateRef('container');
const containerClass = ref<'w-full' | 'h-full'>('w-full');

function calculateLayout() {
    requestAnimationFrame(() => {
        const { aspectRatio } = props;

        if (container.value && aspectRatio) {
            const hScale = container.value.offsetWidth / aspectRatio;
            const vScale = container.value.offsetHeight;

            containerClass.value = hScale <= vScale ? 'w-full' : 'h-full';
        }
    });
}

watch(() => props.aspectRatio, calculateLayout);

useResizeObserver(container, calculateLayout);
</script>

<template>
    <div class="relative">
        <div
            ref="container"
            class="absolute inset-0 flex justify-center items-center overflow-hidden"
        >
            <div
                :class="containerClass"
                :style="{
                    aspectRatio
                }"
            >
                <slot />
            </div>
        </div>
    </div>
</template>
