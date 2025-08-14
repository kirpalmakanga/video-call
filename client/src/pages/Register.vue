<script setup lang="ts">
import RegisterForm from '../components/auth/RegisterForm.vue';
</script>

<template>
    <div class="flex grow items-center justify-center p-4">
        <div class="bg-gray-900 rounded p-4 md:w-sm shadow">
            <h1 class="mb-6 font-bold text-center">Register</h1>

            <RegisterForm />

            <USeparator class="my-4" />

            <p class="text-sm">
                Already have an account ?
                <ULink class="font-bold" to="/login">Log in</ULink>
            </p>
        </div>
    </div>
</template>
