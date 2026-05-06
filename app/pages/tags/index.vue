<script setup lang="ts">
const { setPageTitle } = usePageTitle()
setPageTitle("Mainasara's Post Tags")

// Fetch all content to extract tags
const { data: posts } = await useAsyncData('posts-for-tags', () =>
  queryCollection('blog')
    .where('draft', '<>', true)
    .all()
)

const { data: talks } = await useAsyncData('talks-for-tags', () =>
  queryCollection('talk')
    .where('draft', '<>', true)
    .all()
)

// Extract and count all tags
const tagCounts = computed(() => {
  const counts: Record<string, number> = {}
  const allContent = [...(posts.value || []), ...(talks.value || [])]

  allContent.forEach(item => {
    item.tags?.forEach((tag: string) => {
      counts[tag] = (counts[tag] || 0) + 1
    })
  })

  return counts
})

const sortedTags = computed(() => {
  return Object.entries(tagCounts.value)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
})

useSeoMeta({
  title: "Tags | Mainasara's Blog",
  description: 'Browse all tags',
})
</script>

<template>
  <div id="main-content" class="page-container">
    <section class="py-8">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-navy/60 dark:text-gray-400">
        Index
      </p>
      <h1 class="mt-2 font-display text-4xl font-extrabold tracking-tight text-navy dark:text-gray-100 sm:text-5xl">
        Tags
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-navy/70 dark:text-gray-300">
        Follow threads across posts and talks by topic.
      </p>
    </section>

    <section class="py-4">
      <div v-if="sortedTags.length" class="flex flex-wrap gap-3">
        <NuxtLink
          v-for="(tag, index) in sortedTags"
          :key="tag"
          :to="`/tags/${tag}`"
          class="tag text-base animate-fade-in opacity-0"
          :class="`stagger-${(index % 5) + 1}`"
          :style="{ animationFillMode: 'forwards' }"
        >
          #{{ tag }}
          <span class="ml-1 text-sm opacity-60">
            ({{ tagCounts[tag] }})
          </span>
        </NuxtLink>
      </div>

      <div v-else class="py-12 text-center text-navy/60 dark:text-gray-400">
        No tags found.
      </div>
    </section>
  </div>
</template>
