<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{
    id: string;
    name: string;
    isOwned?: boolean;
    isFavorite?: boolean;
    creator?: { id: string; firstName: string; lastName: string };
}>();

const emit = defineEmits<{ 'toggle-favorite': [id: string] }>();
</script>

<template>
    <div class="group relative">
        <RouterLink
            class="flex flex-col items-center text-neutral-100 rounded transition-colors overflow-hidden"
            :to="`/room/${id}/setup`"
        >
            <span
                class="aspect-video bg-gray-900 flex items-center justify-center w-full"
            >
                <UIcon class="size-8" name="i-mdi-account-group" />
            </span>

            <span
                class="flex flex-col grow bg-gray-700 group-hover:bg-gray-600 w-full p-3 transition-colors gap-2"
            >
                <span class="leading-none">{{ name }}</span>

                <span v-if="creator" class="text-xs leading-none">
                    Hosted by: {{ creator.firstName }} {{ creator.lastName }}
                </span>
            </span>
        </RouterLink>

        <UTooltip
            v-if="!isOwned"
            :text="
                isFavorite
                    ? `Remove ${name} from favorites`
                    : `Add ${name} to favorites`
            "
        >
            <UButton
                class="absolute top-3 right-3 rounded-full"
                type="button"
                :icon="isFavorite ? 'i-mdi-heart' : 'i-mdi-heart-outline'"
                @click.stop="emit('toggle-favorite', id)"
            />
        </UTooltip>
    </div>
</template>
