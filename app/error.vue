<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout>
    <div class="page-container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div class="relative">
        <div class="absolute -left-8 -top-8 h-16 w-16 animate-bounce-subtle rounded-full bg-coral/10 dark:bg-cyan-accent/10" />
        <div class="absolute -bottom-4 -right-4 h-8 w-8 animate-pulse-dot rounded-full bg-coral/20 dark:bg-cyan-accent/20" />

        <h1 class="text-8xl font-bold text-navy dark:text-gray-100">
          {{ error?.statusCode || 500 }}
        </h1>
      </div>

      <p class="mt-6 text-xl text-navy/60 dark:text-gray-400">
        {{ error?.message || 'Something went wrong' }}
      </p>

      <button
        @click="handleError"
        class="btn btn-primary mt-8"
      >
        <Icon name="ph:house" class="h-5 w-5" />
        Back Home
      </button>
    </div>
  </NuxtLayout>
</template>
