<script setup lang="ts">
withDefaults(
    defineProps<{
        title: string;
        cancelText?: string;
        cancelColor?: string;
        confirmText?: string;
        confirmColor?: string;
    }>(),
    {
        cancelText: 'Cancel',
        cancelColor: 'error',
        confirmText: 'Confirm',
        confirmColor: 'success'
    }
);

const emit = defineEmits<{ confirm: [e: void] }>();

const isOpen = defineModel<boolean>('isOpen');

function handleConfirm() {
    isOpen.value = false;

    emit('confirm');
}
</script>

<template>
    <UModal :title="title" v-model:open="isOpen">
        <slot />

        <template #footer>
            <div class="flex grow gap-2 justify-end">
                <UButton
                    color="neutral"
                    :label="cancelText"
                    @click="isOpen = false"
                />

                <UButton
                    color="error"
                    :label="confirmText"
                    @click="handleConfirm"
                />
            </div>
        </template>
    </UModal>
</template>
