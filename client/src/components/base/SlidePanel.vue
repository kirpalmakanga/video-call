<script setup lang="ts">
import Icon from './Icon.vue';

const props = defineProps<{
    isVisible: boolean;
    title?: string;
}>();

const emit = defineEmits<{ close: [e: void] }>();

const onClickClose = () => props.isVisible && emit('close');
</script>

<template>
    <Teleport to="#slide-panel">
        <Transition name="fade">
            <div
                v-if="isVisible"
                class="fixed top-0 left-0 right-0 bottom-0 bg-black opacity-50"
                @click="onClickClose"
            ></div>
        </Transition>

        <Transition name="slide-left">
            <div
                v-if="isVisible"
                class="fixed top-0 right-0 bottom-0 w-full md:w-1/2 lg:w-1/3 bg-gray-900 p-4 flex flex-col"
            >
                <header
                    class="flex items-center gap-2 pb-2 mb-2 border-b-2 border-gray-200 text-gray-200"
                >
                    <button class="inline-flex" @click="onClickClose">
                        <Icon class="w-5 h-5" name="close" />
                    </button>

                    <div v-if="title" class="flex-grow text-md">
                        {{ title }}
                    </div>
                </header>

                <div class="flex flex-col flex-grow"><slot /></div>
            </div>
        </Transition>
    </Teleport>
</template>
