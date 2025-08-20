<script setup lang="ts">
import Placeholder from '../base/Placeholder.vue';

const emit = defineEmits<{ reload: [e: void] }>();
</script>

<template>
    <div class="flex flex-col justify-center items-center grow">
        <Placeholder
            icon="i-mdi-alert-circle-outline"
            text="An error has occured, try to reload the page."
        >
            <UButton icon="i-mdi-reload" @click="emit('reload')">
                Reload
            </UButton>
        </Placeholder>
    </div>
</template>
