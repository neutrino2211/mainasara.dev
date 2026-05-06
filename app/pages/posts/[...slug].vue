<script setup lang="ts">
const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug

const { data: post } = await useAsyncData(`post-${slug}`, () =>
  queryCollection('blog')
    .where('path', '=', `/blog/${slug}`)
    .first()
)

if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Post not found',
  })
}

const formattedDate = computed(() => {
  if (!post.value?.pubDatetime) return ''
  return new Date(post.value.pubDatetime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const modifiedDate = computed(() => {
  if (!post.value?.modDatetime) return null
  return new Date(post.value.modDatetime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// Build OG image URL
const ogImageUrl = computed(() => {
  const params = new URLSearchParams({ title: post.value?.title || '' })
  if (post.value?.image) params.set('image', post.value.image)
  return `/og/${slug}.png?${params.toString()}`
})

useSeoMeta({
  title: () => `${post.value?.title} | Mainasara's Blog`,
  description: () => post.value?.description,
  ogTitle: () => post.value?.title,
  ogDescription: () => post.value?.description,
  ogImage: ogImageUrl,
  articlePublishedTime: () => post.value?.pubDatetime,
  articleModifiedTime: () => post.value?.modDatetime,
})
</script>

<template>
  <article id="main-content" class="page-container">
    <!-- Back link -->
    <div class="py-6">
      <NuxtLink
        to="/posts"
        class="inline-flex items-center gap-2 text-sm text-navy/60 transition-colors hover:text-coral dark:text-gray-400 dark:hover:text-cyan-accent"
      >
        <Icon name="ph:arrow-left" class="h-4 w-4" />
        Back to posts
      </NuxtLink>
    </div>

    <header class="pb-8">
      <!-- Date -->
      <div class="flex flex-wrap items-center gap-2 text-sm text-navy/60 dark:text-gray-400">
        <time :datetime="post?.pubDatetime">
          {{ formattedDate }}
        </time>
        <template v-if="modifiedDate">
          <span class="text-coral dark:text-cyan-accent">//</span>
          <span>Updated {{ modifiedDate }}</span>
        </template>
      </div>

      <!-- Title -->
      <h1 class="mt-4 text-3xl font-bold text-navy dark:text-gray-100 sm:text-4xl">
        {{ post?.title }}
      </h1>

      <!-- Description -->
      <p class="mt-4 text-lg text-navy/70 dark:text-gray-300">
        {{ post?.description }}
      </p>

      <!-- Tags -->
      <div v-if="post?.tags?.length" class="mt-6 flex flex-wrap gap-2">
        <NuxtLink
          v-for="tag in post.tags"
          :key="tag"
          :to="`/tags/${tag}`"
          class="tag"
        >
          #{{ tag }}
        </NuxtLink>
      </div>
    </header>

    <div class="accent-line" />

    <!-- Content -->
    <div class="prose prose-lg py-8 dark:prose-invert">
      <ContentRenderer v-if="post" :value="post" />
    </div>

    <div class="accent-line" />

    <!-- Share & Navigation -->
    <footer class="flex items-center justify-between py-8">
      <NuxtLink
        to="/posts"
        class="btn btn-ghost"
      >
        <Icon name="ph:arrow-left" class="h-4 w-4" />
        All Posts
      </NuxtLink>

      <div class="flex items-center gap-2">
        <span class="text-sm text-navy/60 dark:text-gray-400">Share:</span>
        <a
          :href="`https://twitter.com/intent/tweet?text=${encodeURIComponent(post?.title || '')}&url=${encodeURIComponent(`https://blog.mainasara.dev/posts/${slug}`)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-md p-2 transition-colors hover:bg-navy/5 dark:hover:bg-gray-200/10"
          aria-label="Share on Twitter"
        >
          <Icon name="ph:twitter-logo" class="h-5 w-5" />
        </a>
      </div>
    </footer>
  </article>
</template>
