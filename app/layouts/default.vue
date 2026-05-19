<script setup lang="ts">
const bannerUnlocked = useState<boolean>('ceasefire-banner-unlocked', () => false)
const bannerRequiresUnlock = useState<boolean>('ceasefire-banner-requires-unlock', () => false)
const showBanner = computed(() => !bannerRequiresUnlock.value || bannerUnlocked.value)
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-x-clip">
    <CeasefireBanner v-if="showBanner" />
    <AppHeader />

    <main class="relative z-10 flex-1">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
