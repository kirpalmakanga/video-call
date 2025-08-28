<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ roomName: string }>();

const emit = defineEmits<{ confirmed: [e: void] }>();

const isOpen = ref<boolean>();
</script>

<template>
    <UModal :title="`Leave room: ${roomName} ?`" v-model:open="isOpen">
        <slot />

        <template #footer>
            <div class="flex grow gap-2 justify-end">
                <UButton color="neutral" label="Stay" @click="isOpen = false" />

                <UButton
                    color="error"
                    label="Leave"
                    @click="emit('confirmed')"
                />
            </div>
        </template>
    </UModal>
</template>
