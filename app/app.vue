<script setup lang="ts">
const bannerUnlocked = useState<boolean>('ceasefire-banner-unlocked', () => false)
const bannerRequiresUnlock = useState<boolean>('ceasefire-banner-requires-unlock', () => false)
const secretSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
const showBanner = computed(() => !bannerRequiresUnlock.value || bannerUnlocked.value)

let sequenceIndex = 0
let tfpBannerCreated = false

const createTFPBanner = () => {
  if (typeof window === 'undefined' || tfpBannerCreated || !showBanner.value) return

  const tfpBanner = (window as any).TFPBanner
  if (!tfpBanner?.create) return

  tfpBanner.create({
    theme: 'auto',
    fixed: false,
  })
  tfpBannerCreated = true
}

const handleSecretSequence = (event: KeyboardEvent) => {
  if (!bannerRequiresUnlock.value) return
  if (bannerUnlocked.value) return

  const expectedKey = secretSequence[sequenceIndex]
  if (event.code === expectedKey) {
    sequenceIndex += 1
    if (sequenceIndex === secretSequence.length) {
      bannerUnlocked.value = true
      sequenceIndex = 0
      createTFPBanner()
    }
    return
  }

  sequenceIndex = event.code === secretSequence[0] ? 1 : 0
}

watch(showBanner, isVisible => {
  if (isVisible) createTFPBanner()
})

// Initialize hidden banner unlock + Swetrix analytics
onMounted(() => {
  if (typeof window !== 'undefined') {
    if (bannerRequiresUnlock.value) {
      window.addEventListener('keydown', handleSecretSequence)
    }
    createTFPBanner()
  }

  // Swetrix analytics
  if (typeof window !== 'undefined' && (window as any).swetrix) {
    (window as any).swetrix.init('JpwsFtS91vXz', {
      apiURL: 'https://api.swetrix.mainasara.dev/log',
    })
    ;(window as any).swetrix.trackViews()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    if (bannerRequiresUnlock.value) {
      window.removeEventListener('keydown', handleSecretSequence)
    }
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
