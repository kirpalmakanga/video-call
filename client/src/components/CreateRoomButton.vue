<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import { reactive, ref } from 'vue';
import { object, string, type InferType } from 'yup';
import { useCreateRoomMutation } from '../services/queries';
import { useDebounceFn } from '@vueuse/core';

const isModalOpen = ref<boolean>(false);

const formSchema = object({
    name: string().required('Required')
});

type FormSchema = InferType<typeof formSchema>;

const formState = reactive<FormSchema>({
    name: ''
});

const { mutateAsync: createRoom, asyncStatus } = useCreateRoomMutation();

async function onSubmit({ data }: FormSubmitEvent<FormSchema>) {
    if (asyncStatus.value === 'loading') return;

    isModalOpen.value = false;

    await createRoom(data);

    formState.name = '';
}
</script>

<template>
    <UModal v-model:open="isModalOpen" title="Create room" :ui="{ content: 'max-w-sm' }">
        <UButton icon="i-mdi-plus-circle-outline" size="xs" :disabled="asyncStatus === 'loading'">
            Create room
        </UButton>

        <template #body>
            <UForm
                class="flex flex-col gap-4"
                :schema="formSchema"
                :state="formState"
                @submit="onSubmit"
            >
                <UFormField label="Name" :disabled="asyncStatus === 'loading'" name="name">
                    <UInput
                        class="w-full"
                        variant="soft"
                        v-model="formState.name"
                        :autofocus="true"
                    />
                </UFormField>

                <UButton class="self-end" icon="i-mdi-plus-circle-outline" type="submit">
                    Create
                </UButton>
            </UForm>
        </template>
    </UModal>
</template>
