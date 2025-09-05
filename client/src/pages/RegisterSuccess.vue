<script setup lang="ts">
import { useRoute } from 'vue-router';
import { requestVerificationEmail } from '../services/api';
import { ref } from 'vue';
const {
    query: { email }
} = useRoute();

const toast = useToast();

const isSending = ref<boolean>(false);

async function requestEmail() {
    if (email) {
        try {
            isSending.value = true;

            await requestVerificationEmail(email as string);

            toast.add({
                title: 'Email sent',
                description: 'Please check your inbox.'
            });
        } catch (error) {
            toast.add({
                title: 'Error',
                description:
                    error?.response?.data.error ||
                    `Couldn't send verification email, please try later.`,
                color: 'error'
            });
        } finally {
            isSending.value = false;
        }
    }
}
</script>

<template>
    <div class="flex grow items-center justify-center p-4">
        <div class="flex flex-col bg-gray-900 rounded p-4 md:w-sm shadow">
            <h1 class="mb-6 font-bold text-center">Successfully registered</h1>

            <p class="text-sm mb-4">
                A verification email has been sent to {{ email }}. If you
                received it, you can close this window. Otherwise, click the
                button below.
            </p>

            <UButton
                class="self-end"
                icon="i-mdi-send-variant-outline"
                :loading="isSending"
                @click="requestEmail"
            >
                {{ isSending ? 'Sending...' : 'Send again' }}
            </UButton>
        </div>
    </div>
</template>
