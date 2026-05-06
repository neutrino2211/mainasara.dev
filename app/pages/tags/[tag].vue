<script setup lang="ts">
const route = useRoute()
const tag = route.params.tag as string

// Fetch all content and filter by tag client-side (CONTAINS not supported in SQLite)
const { data: posts } = await useAsyncData(`posts-tag-${tag}`, async () => {
  const all = await queryCollection('blog')
    .where('draft', '<>', true)
    .order('pubDatetime', 'DESC')
    .all()
  return all.filter(post => post.tags?.includes(tag))
})

const { data: talks } = await useAsyncData(`talks-tag-${tag}`, async () => {
  const all = await queryCollection('talk')
    .where('draft', '<>', true)
    .order('pubDatetime', 'DESC')
    .all()
  return all.filter(talk => talk.tags?.includes(tag))
})

// Combine and sort
const allContent = computed(() => {
  const combined = [...(posts.value || []), ...(talks.value || [])]
  return combined.sort((a, b) =>
    new Date(b.pubDatetime).getTime() - new Date(a.pubDatetime).getTime()
  )
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

useSeoMeta({
  title: () => `#${tag} | Mainasara's Blog`,
  description: () => `Posts tagged with #${tag}`,
})
</script>

<template>
  <div id="main-content" class="page-container">
    <section class="py-12">
      <NuxtLink
        to="/tags"
        class="inline-flex items-center gap-2 text-sm text-navy/60 transition-colors hover:text-coral dark:text-gray-400 dark:hover:text-cyan-accent"
      >
        <Icon name="ph:arrow-left" class="h-4 w-4" />
        All tags
      </NuxtLink>

      <h1 class="mt-6 text-3xl font-bold text-navy dark:text-gray-100 sm:text-4xl">
        <span class="text-coral dark:text-cyan-accent">#</span>{{ tag }}
      </h1>
      <p class="mt-4 text-navy/60 dark:text-gray-400">
        {{ allContent.length }} post{{ allContent.length !== 1 ? 's' : '' }} tagged with #{{ tag }}
      </p>
    </section>

    <div class="accent-line" />

    <section class="py-12">
      <div v-if="allContent.length" class="grid gap-6">
        <PostCard
          v-for="(item, index) in allContent"
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

      <div v-else class="py-12 text-center text-navy/60 dark:text-gray-400">
        No posts found with this tag.
      </div>
    </section>
  </div>
</template>
