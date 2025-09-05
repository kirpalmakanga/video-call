<script setup lang="ts">
import ResetPasswordForm from '../components/auth/ResetPasswordForm.vue';
</script>

<template>
    <div class="flex grow items-center justify-center p-4">
        <div class="bg-gray-900 rounded p-4 md:w-sm shadow">
            <ULink class="inline-flex items-center text-sm gap-1" href="/login">
                <UIcon class="size-4" name="i-mdi-arrow-left" />
                Back to sign in form
            </ULink>

            <USeparator class="my-2" />

            <h1 class="mb-6 font-bold text-center">Reset password</h1>

            <ResetPasswordForm />
        </div>
    </div>
</template>
