<script setup lang="ts">
import { object, string } from 'yup';
import type { InferType } from 'yup';
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../composables/store/use-auth-store';

const router = useRouter();
const toast = useToast();
const { register } = useAuthStore();

const schema = object({
    firstName: string().required('Required'),
    lastName: string().required('Required'),
    email: string().email('Invalid email').required('Required'),
    password: string()
        .min(8, 'Must be at least 8 characters')
        .required('Required')
});

type Schema = InferType<typeof schema>;

const state = reactive<Schema>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
});

async function onSubmit({ data }: FormSubmitEvent<Schema>) {
    try {
        await register(data);

        router.replace('/');
    } catch (error) {
        console.error(error);

        toast.add({
            title: 'Error',
            description: `Couldn't register, check your credentials.`,
            color: 'error'
        });
    }
}
</script>

<template>
    <div class="flex grow items-center justify-center">
        <div class="bg-gray-900 rounded p-4 md:w-sm shadow">
            <h1 class="mb-6 font-bold text-center">Register</h1>

            <UForm
                :schema="schema"
                :state="state"
                class="flex flex-col gap-4"
                @submit="onSubmit"
            >
                <UFormField label="First name" name="firstName">
                    <UInput
                        class="w-full"
                        variant="soft"
                        v-model="state.firstName"
                    />
                </UFormField>

                <UFormField label="Last name" name="lastName">
                    <UInput
                        class="w-full"
                        variant="soft"
                        v-model="state.lastName"
                    />
                </UFormField>

                <UFormField label="Email" name="email">
                    <UInput
                        class="w-full"
                        variant="soft"
                        v-model="state.email"
                        type="email"
                    />
                </UFormField>

                <UFormField label="Password" name="password">
                    <UInput
                        class="w-full"
                        variant="soft"
                        v-model="state.password"
                        type="password"
                    />
                </UFormField>

                <UButton class="self-end" type="submit">Submit</UButton>
            </UForm>

            <USeparator class="my-4" />

            <p class="text-sm">
                Already have an account ?
                <ULink class="font-bold" to="/login">Log in</ULink>
            </p>
        </div>
    </div>
</template>
