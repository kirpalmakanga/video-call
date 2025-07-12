<script setup lang="ts">
import { throttle } from '../../utils/helpers.js';

import { onBeforeUnmount, onMounted, ref } from 'vue';

defineProps<{ scrollableClass?: string }>();

const innerContainer = ref<HTMLDivElement>();
const isScrollable = ref<boolean>(false);
const observer = ref<MutationObserver | null>(null);

const emit = defineEmits<{
    scroll: [e: Event];
    'reached-bottom': [e: void];
}>();

const handleScroll = throttle((e: Event) => {
    const { currentTarget } = e;

    if (!currentTarget) {
        return;
    }

    const { scrollTop, scrollHeight, offsetHeight } =
        currentTarget as HTMLDivElement;

    if (scrollTop >= scrollHeight - offsetHeight) {
        emit('reached-bottom');
    }

    emit('scroll', e);
}, 10);

function checkIfScrollable() {
    if (innerContainer.value) {
        const { value: container } = innerContainer;

        isScrollable.value = container.scrollHeight > container.clientHeight;
    }
}

onMounted(() => {
    if (innerContainer.value) {
        const { value: container } = innerContainer;

        checkIfScrollable();

        observer.value = new MutationObserver(checkIfScrollable);
        observer.value.observe(container, { childList: true, subtree: true });
    }
});

onBeforeUnmount(() => {
    observer.value?.disconnect();
    observer.value = null;
});
</script>

<template>
    <div class="relative overflow-hidden">
        <div
            ref="innerContainer"
            class="absolute top-0 left-0 right-0 bottom-0 overflow-auto"
            :class="isScrollable ? scrollableClass : null"
            @scroll="handleScroll"
        >
            <slot />
        </div>
    </div>
</template>
