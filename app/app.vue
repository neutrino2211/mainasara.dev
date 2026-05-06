<script setup lang="ts">
// Initialize Tech for Palestine banner and Swetrix analytics
onMounted(() => {
  // Tech for Palestine banner
  if (typeof window !== 'undefined' && (window as any).TFPBanner) {
    (window as any).TFPBanner.create({
      theme: 'auto',
      fixed: false,
    })
  }

  // Swetrix analytics
  if (typeof window !== 'undefined' && (window as any).swetrix) {
    (window as any).swetrix.init('JpwsFtS91vXz', {
      apiURL: 'https://api.swetrix.mainasara.dev/log',
    })
    ;(window as any).swetrix.trackViews()
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
