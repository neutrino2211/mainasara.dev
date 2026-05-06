<script setup lang="ts">
const currentYear = new Date().getFullYear()

const socials = [
  { name: 'Github', icon: 'ph:github-logo', href: 'https://github.com/neutrino2211/' },
  { name: 'Twitter', icon: 'ph:twitter-logo', href: 'https://twitter.com/neutrino2211' },
  { name: 'Twitch', icon: 'ph:twitch-logo', href: 'https://twitch.tv/Neutrino2211' },
  { name: 'Email', icon: 'ph:envelope', href: 'mailto:tsowamainasara@gmail.com' },
]

const footerLinks = [
  { path: '/posts', label: 'Posts' },
  { path: '/talks', label: 'Talks' },
  { path: '/tags', label: 'Tags' },
  { path: '/about', label: 'About' },
  { path: '/search', label: 'Search' },
]
</script>

<template>
  <footer id="footer" class="mt-auto py-8">
    <div class="page-container">
      <div class="card px-5 py-6 md:px-7">
        <nav class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-navy/75 dark:text-gray-300">
          <NuxtLink
            v-for="link in footerLinks"
            :key="link.path"
            :to="link.path"
            class="transition-colors hover:text-coral dark:hover:text-cyan-accent"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="accent-line my-5" />

        <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p class="max-w-xl text-sm text-navy/65 dark:text-gray-400">
            &copy; {{ currentYear }} Mainasara Tsowa. Built as a living notebook for software, security, and ideas in motion.
          </p>

          <div class="flex items-center gap-2">
            <a
              v-for="social in socials"
              :key="social.name"
              :href="social.href"
              :aria-label="social.name"
              :title="social.name"
              target="_blank"
              rel="noopener noreferrer"
              class="border-2 border-navy/20 p-2 text-navy/70 transition-colors hover:border-coral hover:text-coral dark:border-gray-500/60 dark:text-gray-300 dark:hover:border-cyan-accent dark:hover:text-cyan-accent"
            >
              <Icon :name="social.icon" class="h-5 w-5" />
            </a>

            <a
              href="/rss.xml"
              aria-label="RSS Feed"
              title="RSS Feed"
              class="border-2 border-navy/20 p-2 text-navy/70 transition-colors hover:border-coral hover:text-coral dark:border-gray-500/60 dark:text-gray-300 dark:hover:border-cyan-accent dark:hover:text-cyan-accent"
            >
              <Icon name="ph:rss" class="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
