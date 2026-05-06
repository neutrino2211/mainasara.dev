<script setup lang="ts">
useSeoMeta({
  title: "404 - Page Not Found | Mainasara's Blog",
})
</script>

<template>
  <div id="main-content" class="page-container flex min-h-[60vh] flex-col items-center justify-center text-center">
    <div class="relative">
      <!-- Decorative elements -->
      <div class="absolute -left-8 -top-8 h-16 w-16 animate-bounce-subtle rounded-full bg-coral/10 dark:bg-cyan-accent/10" />
      <div class="absolute -bottom-4 -right-4 h-8 w-8 animate-pulse-dot rounded-full bg-coral/20 dark:bg-cyan-accent/20" />

      <h1 class="text-8xl font-bold text-navy dark:text-gray-100">
        4<span class="text-coral dark:text-cyan-accent">0</span>4
      </h1>
    </div>

    <p class="mt-6 text-xl text-navy/60 dark:text-gray-400">
      Oops! This page doesn't exist.
    </p>

    <p class="mt-2 text-navy/40 dark:text-gray-500">
      Maybe the link is broken, or the page has been moved.
    </p>

    <NuxtLink
      to="/"
      class="btn btn-primary mt-8"
    >
      <Icon name="ph:house" class="h-5 w-5" />
      Back Home
    </NuxtLink>
  </div>
</template>
