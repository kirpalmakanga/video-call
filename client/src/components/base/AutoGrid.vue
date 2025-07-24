<script setup lang="ts" generic="T extends Record<string, unknown>">
import { useTemplateRef } from 'vue';
import {
    useDebounceFn,
    useMutationObserver,
    useResizeObserver
} from '@vueuse/core';

interface GridLayout {
    width: number;
    height: number;
}

const props = defineProps<{
    items: T[];
    itemKey: keyof T;
    itemAspectRatio: number;
}>();

const container = useTemplateRef<HTMLUListElement>('container');

function calculateLayout(
    containerWidth: number,
    containerHeight: number,
    videoCount: number,
    aspectRatio: number
): GridLayout {
    let bestLayout = {
        area: 0,
        columns: 0,
        rows: 0,
        width: 0,
        height: 0
    };

    for (let columns = 1; columns <= videoCount; columns++) {
        const rows = Math.ceil(videoCount / columns);
        const hScale = containerWidth / (columns * aspectRatio);
        const vScale = containerHeight / rows;

        let width;
        let height;

        if (hScale <= vScale) {
            width = Math.floor(containerWidth / columns);
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
                columns
            };
        }
    }

    return bestLayout;
}

const recalculateLayout = useDebounceFn(() => {
    if (container.value) {
        const { offsetHeight: containerHeight, offsetWidth: containerWidth } =
            container.value;

        const { width, height } = calculateLayout(
            containerWidth,
            containerHeight,
            props.items.length,
            props.itemAspectRatio
        );

        container.value.style.setProperty(
            '--autogrid-cell-width',
            `${width}px`
        );
        container.value.style.setProperty(
            '--autogrid-cell-height',
            `${height}px`
        );
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
            <li
                v-for="item in items"
                :key="item[itemKey]"
                class="flex w-[var(--autogrid-cell-width)] h-[var(--autogrid-cell-height)]"
            >
                <slot name="item" v-bind="item" />
            </li>
        </ul>
    </div>
</template>
