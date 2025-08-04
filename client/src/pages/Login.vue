<script setup lang="ts">
import { object, string } from 'yup';
import type { InferType } from 'yup';
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import { useAuthStore } from '../composables/store/use-auth-store';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();

const authStore = useAuthStore();
const { logIn } = authStore;

const schema = object({
    email: string().email('Invalid email').required('Required'),
    password: string()
        .min(8, 'Must be at least 8 characters')
        .required('Required')
});

type Schema = InferType<typeof schema>;

const state = reactive<Schema>({
    email: '',
    password: ''
});

async function onSubmit({ data }: FormSubmitEvent<Schema>) {
    try {
        await logIn(data);
    } catch (error) {
        console.error(error);

        toast.add({
            title: 'Error',
            description: `Couldn't log in, check your credentials.`,
            color: 'error'
        });
    }
}
</script>

<template>
    <div class="flex grow items-center justify-center">
        <div class="bg-gray-700 rounded p-4">
            <h1 class="mb-6">Log in</h1>

            <UForm
                :schema="schema"
                :state="state"
                class="flex flex-col gap-4"
                @submit="onSubmit"
            >
                <UFormField label="Email" name="email">
                    <UInput variant="soft" v-model="state.email" type="email" />
                </UFormField>

                <UFormField label="Password" name="password">
                    <UInput
                        variant="soft"
                        v-model="state.password"
                        type="password"
                    />
                </UFormField>

                <UButton class="self-end" type="submit">Submit</UButton>
            </UForm>
        </div>
    </div>
</template>
