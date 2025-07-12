<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{ aspectRatio: number }>();

const container = ref<HTMLDivElement | null>(null);
const resizeObserver = ref<ResizeObserver | null>(null);
const containerClass = ref<'w-full' | 'h-full'>('w-full');

function calculateLayout() {
    const { aspectRatio } = props;

    if (container.value && aspectRatio) {
        const hScale = container.value.offsetWidth / aspectRatio;
        const vScale = container.value.offsetHeight;

        containerClass.value = hScale <= vScale ? 'w-full' : 'h-full';
    }
}

function enableObserver() {
    if (container.value) {
        resizeObserver.value = new ResizeObserver(() =>
            requestAnimationFrame(calculateLayout)
        );

        resizeObserver.value.observe(container.value);
    }
}

function disableObserver() {
    if (resizeObserver.value) {
        resizeObserver.value.disconnect();

        resizeObserver.value = null;
    }
}

watch(() => props.aspectRatio, calculateLayout);

onMounted(enableObserver);

onBeforeUnmount(disableObserver);
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
