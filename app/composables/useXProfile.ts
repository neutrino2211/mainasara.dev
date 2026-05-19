export function useXProfile() {
  const bannerRequiresUnlock = useState<boolean>('ceasefire-banner-requires-unlock', () => false)

  const xHandle = computed(() => (bannerRequiresUnlock.value ? 'alitesec' : 'neutrino2211'))
  const xProfileUrl = computed(() => `https://x.com/${xHandle.value}`)

  return {
    xHandle,
    xProfileUrl,
  }
}

