<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import { reactive, ref, watch } from 'vue';
import { object, string, type InferType } from 'yup';
import { useCreateRoomMutation } from '../utils/queries';
import { useDebounceFn } from '@vueuse/core';

const toast = useToast();

const isModalOpen = ref<boolean>(false);

const formSchema = object({
    name: string().required('Required')
});

type FormSchema = InferType<typeof formSchema>;

const formState = reactive<FormSchema>({
    name: ''
});

const {
    mutate: createRoom,
    status,
    asyncStatus,
    error
} = useCreateRoomMutation();

const onSubmit = useDebounceFn(({ data }: FormSubmitEvent<FormSchema>) => {
    createRoom(data);
}, 400);

watch(status, (value) => {
    switch (value) {
        case 'success':
            toast.add({
                title: 'Success',
                description: `Created room: ${formState.name}.`,
                color: 'success'
            });

            isModalOpen.value = false;

            formState.name = '';
            break;

        case 'error':
            toast.add({
                title: 'Failed to create room',
                description:
                    error.value?.response?.data.error ||
                    `Couldn't create room, please try later.`,
                color: 'error'
            });
            break;
    }
});
</script>

<template>
    <UModal
        v-model:open="isModalOpen"
        title="Create room"
        :ui="{ content: 'max-w-sm' }"
    >
        <UButton
            icon="i-mdi-plus-circle-outline"
            size="xs"
            :disabled="asyncStatus === 'pending'"
        >
            Create room
        </UButton>

        <template #body>
            <UForm
                class="flex flex-col gap-4"
                :schema="formSchema"
                :state="formState"
                @submit="onSubmit"
            >
                <UFormField
                    label="Name"
                    :disabled="asyncStatus === 'pending'"
                    name="name"
                >
                    <UInput
                        class="w-full"
                        variant="soft"
                        v-model="formState.name"
                    />
                </UFormField>

                <UButton
                    class="self-end"
                    icon="i-mdi-plus-circle-outline"
                    type="submit"
                >
                    Create
                </UButton>
            </UForm>
        </template>
    </UModal>
</template>
