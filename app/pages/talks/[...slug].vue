<script setup lang="ts">
const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug

const { data: talk } = await useAsyncData(`talk-${slug}`, () =>
  queryCollection('talk')
    .where('path', '=', `/talk/${slug}`)
    .first()
)

if (!talk.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Talk not found',
  })
}

const formattedDate = computed(() => {
  if (!talk.value?.pubDatetime) return ''
  return new Date(talk.value.pubDatetime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// Build OG image URL
const ogImageUrl = computed(() => {
  const params = new URLSearchParams({ title: talk.value?.title || '' })
  if (talk.value?.image) params.set('image', talk.value.image)
  return `/og/${slug}.png?${params.toString()}`
})

useSeoMeta({
  title: () => `${talk.value?.title} | Mainasara's Blog`,
  description: () => talk.value?.description,
  ogTitle: () => talk.value?.title,
  ogDescription: () => talk.value?.description,
  ogImage: ogImageUrl,
})
</script>

<template>
  <article id="main-content" class="page-container">
    <!-- Back link -->
    <div class="py-6">
      <NuxtLink
        to="/talks"
        class="inline-flex items-center gap-2 text-sm text-navy/60 transition-colors hover:text-coral dark:text-gray-400 dark:hover:text-cyan-accent"
      >
        <Icon name="ph:arrow-left" class="h-4 w-4" />
        Back to talks
      </NuxtLink>
    </div>

    <header class="pb-8">
      <!-- Date -->
      <time
        :datetime="talk?.pubDatetime"
        class="text-sm text-navy/60 dark:text-gray-400"
      >
        {{ formattedDate }}
      </time>

      <!-- Title -->
      <h1 class="mt-4 text-3xl font-bold text-navy dark:text-gray-100 sm:text-4xl">
        {{ talk?.title }}
      </h1>

      <!-- Description -->
      <p class="mt-4 text-lg text-navy/70 dark:text-gray-300">
        {{ talk?.description }}
      </p>

      <!-- Tags -->
      <div v-if="talk?.tags?.length" class="mt-6 flex flex-wrap gap-2">
        <NuxtLink
          v-for="tag in talk.tags"
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
      <ContentRenderer v-if="talk" :value="talk" />
    </div>

    <div class="accent-line" />

    <!-- Navigation -->
    <footer class="py-8">
      <NuxtLink
        to="/talks"
        class="btn btn-ghost"
      >
        <Icon name="ph:arrow-left" class="h-4 w-4" />
        All Talks
      </NuxtLink>
    </footer>
  </article>
</template>
