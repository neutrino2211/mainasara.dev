<script setup lang="ts">
import Fuse from 'fuse.js'

const { setPageTitle } = usePageTitle()
setPageTitle('Search')

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

// Fetch all content
const { data: posts } = await useAsyncData('posts-for-search', () =>
  queryCollection('blog')
    .where('draft', '<>', true)
    .all()
)

const { data: talks } = await useAsyncData('talks-for-search', () =>
  queryCollection('talk')
    .where('draft', '<>', true)
    .all()
)

const allContent = computed(() => [
  ...(posts.value || []),
  ...(talks.value || []),
])

// Initialize Fuse.js
const fuse = computed(() => {
  return new Fuse(allContent.value, {
    keys: ['title', 'description', 'tags'],
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
  })
})

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) {
    return []
  }
  return fuse.value.search(searchQuery.value).map(result => result.item)
})

const getHref = (item: any) => {
  if (item.path.startsWith('/blog')) {
    return `/posts${item.path.replace('/blog', '')}`
  }
  if (item.path.startsWith('/talk')) {
    return `/talks${item.path.replace('/talk', '')}`
  }
  return item.path
}

// Focus input on mount and handle keyboard shortcut
onMounted(() => {
  searchInput.value?.focus()

  // Handle keyboard shortcut
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === '/' && document.activeElement !== searchInput.value) {
      e.preventDefault()
      searchInput.value?.focus()
    }
  }
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
})

useSeoMeta({
  title: "Search | Mainasara's Blog",
  description: 'Search all posts and talks',
})
</script>

<template>
  <div id="main-content" class="page-container">
    <section class="py-8">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-navy/60 dark:text-gray-400">
        Discovery
      </p>
      <h1 class="mt-2 font-display text-4xl font-extrabold tracking-tight text-navy dark:text-gray-100 sm:text-5xl">
        Search
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-navy/70 dark:text-gray-300">
        Find ideas quickly across articles and talks.
      </p>
    </section>

    <!-- Search Input -->
    <div class="relative py-4">
      <Icon
        name="ph:magnifying-glass"
        class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy/40 dark:text-gray-500"
      />
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="search"
        placeholder="Type to search..."
        class="search-input pl-12"
        aria-label="Search"
      />
    </div>

    <div class="accent-line" />

    <!-- Results -->
    <section class="py-12">
      <!-- Show results -->
      <template v-if="searchQuery.trim()">
        <p class="mb-6 text-sm text-navy/60 dark:text-gray-400">
          {{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }} for "{{ searchQuery }}"
        </p>

        <div v-if="searchResults.length" class="grid gap-6">
          <PostCard
            v-for="(item, index) in searchResults"
            :key="item.path"
            :title="item.title"
            :description="item.description"
            :date="item.pubDatetime"
            :tags="item.tags"
            :href="getHref(item)"
            :image="item.image"
            :featured="item.featured"
            class="animate-fade-in opacity-0"
            :class="`stagger-${(index % 5) + 1}`"
            :style="{ animationFillMode: 'forwards' }"
          />
        </div>

        <div v-else class="py-12 text-center">
          <Icon name="ph:magnifying-glass" class="mx-auto h-12 w-12 text-navy/20 dark:text-gray-600" />
          <p class="mt-4 text-navy/60 dark:text-gray-400">
            No results found. Try a different search term.
          </p>
        </div>
      </template>

      <!-- Empty state -->
      <template v-else>
        <div class="py-12 text-center">
          <Icon name="ph:magnifying-glass" class="mx-auto h-12 w-12 text-navy/20 dark:text-gray-600" />
          <p class="mt-4 text-navy/60 dark:text-gray-400">
            Start typing to search...
          </p>
        </div>
      </template>
    </section>
  </div>
</template>
