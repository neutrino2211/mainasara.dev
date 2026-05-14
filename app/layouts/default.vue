<script setup lang="ts">
const route = useRoute()
const bannerUnlocked = useState<boolean>('ceasefire-banner-unlocked', () => false)
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-x-clip">
    <CeasefireBanner v-if="bannerUnlocked" />
    <AppHeader />

    <main class="relative z-10 flex-1">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
