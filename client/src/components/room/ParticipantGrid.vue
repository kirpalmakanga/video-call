<script setup lang="ts">
import { useTemplateRef } from 'vue';
import {
    useDebounceFn,
    useMutationObserver,
    useResizeObserver
} from '@vueuse/core';

interface GridLayout {
    width: number;
    height: number;
    cols: number;
}

const props = defineProps<{ items: ClientParticipant[] }>();

const container = useTemplateRef<HTMLUListElement>('container');

const aspectRatio = 16 / 9;

function calculateLayout(
    containerWidth: number,
    containerHeight: number,
    videoCount: number,
    aspectRatio: number
): GridLayout {
    let bestLayout = {
        area: 0,
        cols: 0,
        rows: 0,
        width: 0,
        height: 0
    };

    for (let cols = 1; cols <= videoCount; cols++) {
        const rows = Math.ceil(videoCount / cols);
        const hScale = containerWidth / (cols * aspectRatio);
        const vScale = containerHeight / rows;

        let width;
        let height;

        if (hScale <= vScale) {
            width = Math.floor(containerWidth / cols);
            height = Math.floor(width / aspectRatio);
        } else {
            height = Math.floor(containerHeight / rows);
            width = Math.floor(height * aspectRatio);
        }

        const area = width * height;

        if (area > bestLayout.area) {
            bestLayout = {
                area,
                width,
                height,
                rows,
                cols
            };
        }
    }

    return bestLayout;
}

const recalculateLayout = useDebounceFn(() => {
    if (container.value) {
        const { offsetHeight: containerHeight, offsetWidth: containerWidth } =
            container.value;

        const { width, height, cols } = calculateLayout(
            containerWidth,
            containerHeight,
            props.items.length,
            aspectRatio
        );

        container.value.style.setProperty('--cell-width', `${width}px`);
        container.value.style.setProperty('--cell-height', `${height}px`);
        container.value.style.setProperty('--cols', cols.toString());
    }
});

useResizeObserver(container, recalculateLayout);

useMutationObserver(container, recalculateLayout, {
    childList: true
});
</script>

<template>
    <div class="relative overflow-hidden">
        <ul
            ref="container"
            class="absolute inset-0 flex flex-wrap justify-center items-center"
        >
            <li v-for="item in items" :key="item.id" class="grid-item flex">
                <slot name="item" v-bind="item" />
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
.grid-item {
    width: var(--cell-width);
    height: var(--cell-height);
}
</style>
