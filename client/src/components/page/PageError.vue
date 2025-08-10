<script setup lang="ts">
import { useRouter } from 'vue-router';
import Placeholder from '../base/Placeholder.vue';

const router = useRouter();
</script>

<template>
    <div class="flex flex-col justify-center items-center grow">
        <Placeholder
            icon="i-mdi-alert-circle-outline"
            text="An error has occured, try to reload the page."
        >
            <UButton icon="i-mdi-reload" @click="router.go()">Reload</UButton>
        </Placeholder>
    </div>
</template>
