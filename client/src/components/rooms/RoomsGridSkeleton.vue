<template>
    <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
        <div class="rounded overflow-hidden shadow">
            <div class="aspect-video bg-gray-900"></div>

            <div class="flex flex-col p-4 bg-gray-700 gap-2">
                <USkeleton class="h-4 w-full" />

                <USkeleton class="h-3 w-12" />
            </div>
        </div>
    </div>
</template>
