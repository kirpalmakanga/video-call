<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { debounce } from '../../utils/helpers';

const props = defineProps<{ users: ClientUser[] }>();

const container = useTemplateRef('container');

const aspectRatio = 16 / 9;

function calculateLayout(
    containerWidth: number,
    containerHeight: number,
    videoCount: number,
    aspectRatio: number
): { width: number; height: number; cols: number } {
    let bestLayout = {
        area: 0,
        cols: 0,
        rows: 0,
        width: 0,
        height: 0
    };

    // brute-force search layout where video occupy the largest area of the container
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

function recalculateLayout() {
    if (container.value) {
        console.log('recalculateLayout');
        const { height: containerHeight, width: containerWidth } =
            container.value.getBoundingClientRect();

        const { width, height, cols } = calculateLayout(
            containerWidth,
            containerHeight,
            props.users.length,
            aspectRatio
        );

        container.value.style.setProperty('--cell-width', `${width - 16}px`);
        container.value.style.setProperty('--cell-height', `${height - 16}px`);
        container.value.style.setProperty('--cols', cols.toString());
    }
}

useResizeObserver(container, debounce(recalculateLayout, 50));

watch(() => props.users, recalculateLayout);
</script>

<template>
    <ul
        ref="container"
        class="flex flex-wrap justify-center items-center overflow-hidden"
    >
        <li
            v-for="user in users"
            :key="user.id"
            class="flex justify-center items-center overflow-hidden rounded"
            :style="{
                width: 'var(--cell-width)',
                height: 'var(--cell-height)'
            }"
        >
            <slot name="item" v-bind="user" />
        </li>
    </ul>
</template>
