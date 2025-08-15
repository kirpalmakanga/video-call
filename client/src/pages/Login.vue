<script setup lang="ts">
import LoginForm from '../components/auth/LoginForm.vue';
</script>

<template>
    <div class="flex grow items-center justify-center p-4">
        <div class="bg-gray-900 rounded p-4 md:w-sm shadow">
            <h1 class="mb-6 font-bold text-center">Sign in</h1>

            <LoginForm />

            <USeparator class="my-4" />

            <p class="text-sm">
                Forgot your password ?
                <ULink class="font-bold" href="/forgot-password">
                    Request reset
                </ULink>
            </p>

            <USeparator class="my-4" />

            <p class="text-sm">
                Don't have an account ?
                <ULink class="font-bold" href="/register">Register here</ULink>
            </p>
        </div>
    </div>
</template>
