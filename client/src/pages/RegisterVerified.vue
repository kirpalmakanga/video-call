<template>
    <div class="flex grow items-center justify-center p-4">
        <div class="flex flex-col bg-gray-900 rounded p-4 md:w-sm shadow">
            <h1 class="mb-6 font-bold text-center">Account verified</h1>

            <p class="text-sm mb-4">
                Your email has been confirmed, you can now log into your
                account.
            </p>

            <UButton class="self-end" icon="i-mdi-login" to="/login">
                Log in
            </UButton>
        </div>
    </div>
</template>
