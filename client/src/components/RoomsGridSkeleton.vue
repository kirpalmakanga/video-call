<template>
    <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
        <div class="rounded overflow-hidden shadow">
            <div class="aspect-video bg-gray-900"></div>

            <div class="p-4 bg-gray-700">
                <USkeleton class="h-5 w-full mb-1" />
                <USkeleton class="h-5 w-9" />
            </div>
        </div>
    </div>
</template>
