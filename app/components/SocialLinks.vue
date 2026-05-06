<script setup lang="ts">
const socials = [
  { name: 'Github', icon: 'ph:github-logo', href: 'https://github.com/neutrino2211/' },
  { name: 'Twitter', icon: 'ph:twitter-logo', href: 'https://twitter.com/neutrino2211' },
  { name: 'Twitch', icon: 'ph:twitch-logo', href: 'https://twitch.tv/Neutrino2211' },
  { name: 'Email', icon: 'ph:envelope', href: 'mailto:tsowamainasara@gmail.com' },
]
</script>

<template>
  <div class="flex items-center gap-3">
    <a
      v-for="social in socials"
      :key="social.name"
      :href="social.href"
      :aria-label="social.name"
      :title="social.name"
      target="_blank"
      rel="noopener noreferrer"
      class="rounded-full p-2.5 text-navy transition-all hover:bg-coral/10 hover:text-coral dark:text-gray-200 dark:hover:bg-cyan-accent/10 dark:hover:text-cyan-accent"
    >
      <Icon :name="social.icon" class="h-5 w-5" />
    </a>
  </div>
</template>
