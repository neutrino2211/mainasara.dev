<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-x-clip">
    <AppHeader />

    <main class="relative z-10 flex-1">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
