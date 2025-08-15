<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useAuthStore } from '../../composables/store/use-auth-store';
import { storeToRefs } from 'pinia';
import { isEqual } from '../../utils/helpers';
import {
    updateProfileSchema,
    type UpdateProfileFormData
} from '../../utils/validation';
import type { FormSubmitEvent } from '@nuxt/ui';
import TextField from '../form/TextField.vue';

const toast = useToast();

const authStore = useAuthStore();
const { updateUserProfile } = authStore;
const { firstName, lastName } = storeToRefs(authStore);

const currentState = computed(() => ({
    firstName: firstName.value,
    lastName: lastName.value
}));

const state = reactive<UpdateProfileFormData>({ ...currentState.value });

async function onSubmit({ data }: FormSubmitEvent<UpdateProfileFormData>) {
    if (isEqual(state, currentState.value)) {
        return;
    }

    try {
        await updateUserProfile(data);

        toast.add({
            title: 'Success',
            description: `Updated profile settings.`
        });
    } catch (error: any) {
        toast.add({
            title: 'Failed signing in',
            description:
                error?.response?.data.error || `Couldn't save profile.`,
            color: 'error'
        });
    }
}
</script>

<template>
    <h2 class="font-bold mb-6">Profile</h2>

    <UForm
        class="flex flex-col gap-4"
        :schema="updateProfileSchema"
        :state="state"
        @submit="onSubmit"
    >
        <TextField
            label="First name"
            name="firstName"
            v-model="state.firstName"
        />

        <TextField label="Last name" name="lastName" v-model="state.lastName" />

        <UButton
            class="self-end"
            icon="i-mdi-content-save-outline"
            type="submit"
        >
            Save modifications
        </UButton>
    </UForm>
</template>
