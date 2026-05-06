<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()
const isMenuOpen = ref(false)
const { pageTitle } = usePageTitle()

const navLinks = [
  { path: '/talks', label: 'Talks' },
  { path: '/posts', label: 'Posts' },
  { path: '/tags', label: 'Tags' },
  { path: '/about', label: 'About' },
]

const displayTitle = computed(() => pageTitle.value || "Mainasara's Blog")

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// Close menu on route change
watch(() => route.path, () => {
  isMenuOpen.value = false
})
</script>

<template>
  <header class="relative z-50">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-coral focus:px-4 focus:py-2 focus:text-cream dark:focus:bg-cyan-accent dark:focus:text-slate-850"
    >
      Skip to content
    </a>
    <a
      href="#footer"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-coral focus:px-4 focus:py-2 focus:text-cream dark:focus:bg-cyan-accent dark:focus:text-slate-850"
    >
      Skip to footer
    </a>

    <div class="page-container">
      <div class="card mt-2 px-4 py-3 sm:px-6 sm:py-4">
        <div class="flex items-center justify-between gap-4">
          <!-- Dynamic Title + explicit home link -->
          <div class="min-w-0">
            <div class="flex items-baseline gap-2">
              <NuxtLink
                to="/"
                class="shrink-0 text-2xl font-bold leading-none text-navy/70 transition-colors hover:text-coral dark:text-gray-300 dark:hover:text-cyan-accent sm:text-3xl"
                aria-label="Go to home page"
              >
                /
              </NuxtLink>
              <Transition name="title" mode="out-in">
                <span
                  :key="displayTitle"
                  class="block truncate font-display text-xl font-extrabold tracking-tight text-navy dark:text-gray-100 sm:text-2xl"
                >
                  {{ displayTitle }}
                </span>
              </Transition>
            </div>
            <span class="hidden text-xs font-medium uppercase tracking-[0.14em] text-navy/50 dark:text-gray-400 sm:block">
              Journal • Essays • Talks
            </span>
          </div>

        <!-- Desktop Navigation -->
        <nav class="hidden items-center gap-2 sm:flex">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="px-3 py-1.5 text-sm font-semibold text-navy/75 transition-colors hover:text-coral dark:text-gray-300 dark:hover:text-cyan-accent"
            :class="{ 'nav-active': isActive(link.path) }"
          >
            {{ link.label }}
          </NuxtLink>

          <!-- Search -->
          <NuxtLink
            to="/search"
            class="ml-1 p-2 text-navy/75 transition-colors hover:bg-navy/5 hover:text-coral dark:text-gray-300 dark:hover:bg-gray-200/10 dark:hover:text-cyan-accent"
            :class="{ 'text-coral dark:text-cyan-accent': isActive('/search') }"
            aria-label="Search"
          >
            <Icon name="ph:magnifying-glass" class="h-5 w-5" />
          </NuxtLink>

          <!-- Theme Toggle -->
          <button
            @click="toggleTheme"
            class="p-2 text-navy/75 transition-colors hover:bg-navy/5 hover:text-coral dark:text-gray-300 dark:hover:bg-gray-200/10 dark:hover:text-cyan-accent"
            aria-label="Toggle theme"
          >
            <Icon
              :name="colorMode.value === 'dark' ? 'ph:sun' : 'ph:moon'"
              class="h-5 w-5 transition-transform hover:rotate-12"
            />
          </button>
        </nav>

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMenu"
          class="border-2 border-navy/40 p-2 text-navy sm:hidden dark:border-gray-500/60 dark:text-gray-200"
          :aria-expanded="isMenuOpen"
          aria-label="Toggle menu"
        >
          <Icon
            :name="isMenuOpen ? 'ph:x' : 'ph:list'"
            class="h-6 w-6"
          />
        </button>
        </div>

      <!-- Mobile Navigation -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <nav
          v-if="isMenuOpen"
          class="mt-3 border-2 border-navy/20 bg-card-light px-4 pb-4 pt-2 dark:border-gray-500/50 dark:bg-card-dark sm:hidden"
        >
          <div class="grid grid-cols-2 gap-2 pt-2">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.path"
              :to="link.path"
              class="border border-transparent px-4 py-3 text-center text-sm font-semibold text-navy/80 transition-colors hover:bg-navy/5 dark:text-gray-200 dark:hover:bg-gray-200/10"
              :class="{ 'nav-active': isActive(link.path) }"
            >
              {{ link.label }}
            </NuxtLink>
          </div>

          <div class="mt-4 flex justify-center gap-4">
            <NuxtLink
              to="/search"
              class="p-3 text-navy/80 transition-colors hover:bg-navy/5 dark:text-gray-200 dark:hover:bg-gray-200/10"
              aria-label="Search"
            >
              <Icon name="ph:magnifying-glass" class="h-6 w-6" />
            </NuxtLink>

            <button
              @click="toggleTheme"
              class="p-3 text-navy/80 transition-colors hover:bg-navy/5 dark:text-gray-200 dark:hover:bg-gray-200/10"
              aria-label="Toggle theme"
            >
              <Icon
                :name="colorMode.value === 'dark' ? 'ph:sun' : 'ph:moon'"
                class="h-6 w-6"
              />
            </button>
          </div>
        </nav>
      </Transition>
      </div>
    </div>
  </header>
</template>
