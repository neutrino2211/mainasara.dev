<script setup lang="ts">
const { setPageTitle } = usePageTitle()
setPageTitle(null)

// Fetch all content
const { data: posts } = await useAsyncData('posts', async () => {
  const all = await queryCollection('blog')
    .order('pubDatetime', 'DESC')
    .all()
  return all.filter(post => post.draft !== true)
})

const { data: talks } = await useAsyncData('talks', async () => {
  const all = await queryCollection('talk')
    .order('pubDatetime', 'DESC')
    .all()
  return all.filter(talk => talk.draft !== true)
})

// Combine and sort all content
const allContent = computed(() => {
  const combined = [...(posts.value || []), ...(talks.value || [])]
  return combined.sort((a, b) =>
    new Date(b.pubDatetime).getTime() - new Date(a.pubDatetime).getTime()
  )
})

const featuredContent = computed(() =>
  allContent.value.filter(item => item.featured)
)

const featuredPreview = computed(() =>
  featuredContent.value.slice(0, 4)
)

const hasMoreFeatured = computed(() =>
  featuredContent.value.length > 4
)

const recentContent = computed(() =>
  allContent.value.slice(0, 4)
)

// Get href based on content type
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
  title: "Mainasara's Blog",
  description: 'A place where Mainasara says things.',
  ogTitle: "Mainasara's Blog",
  ogDescription: 'A place where Mainasara says things.',
  ogImage: '/blog-og.jpg',
})
</script>

<template>
  <div id="main-content" class="page-container">
    <section class="grid gap-6 py-10 lg:grid-cols-[1.3fr_0.8fr] lg:gap-8 lg:py-14">
      <div class="card p-6 md:p-8">
        <p class="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-navy/60 dark:text-gray-400">
          Mainasara Tsowa
        </p>
        <h1 class="text-4xl font-extrabold tracking-tight text-navy dark:text-gray-100 sm:text-6xl">
          Notes from the edge of software and security<span class="cursor-blink"></span>
        </h1>
        <p class="mt-6 max-w-2xl text-base text-navy/80 dark:text-gray-300">
          I write about reverse engineering, backend systems, and practical security. This is where experiments, lessons, and field notes get turned into readable essays.
        </p>
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <NuxtLink to="/posts" class="btn btn-primary">
            Read Posts
            <Icon name="ph:arrow-right" class="h-4 w-4" />
          </NuxtLink>
          <NuxtLink to="/talks" class="btn btn-ghost">
            Browse Talks
          </NuxtLink>
        </div>
      </div>

      <div class="card p-6 md:p-7">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-navy/60 dark:text-gray-400">
          Currently
        </p>
        <ul class="mt-4 space-y-4 text-sm text-navy/80 dark:text-gray-300">
          <li>
            <span class="text-xs font-semibold uppercase tracking-[0.12em] text-coral dark:text-cyan-accent">Focus</span>
            <p class="mt-1">Malware analysis workflows and resilient backend systems.</p>
          </li>
          <li>
            <span class="text-xs font-semibold uppercase tracking-[0.12em] text-coral dark:text-cyan-accent">Writing</span>
            <p class="mt-1">Security misconceptions, machine-code insights, and implementation tradeoffs.</p>
          </li>
          <li>
            <span class="text-xs font-semibold uppercase tracking-[0.12em] text-coral dark:text-cyan-accent">Elsewhere</span>
            <div class="mt-2">
              <SocialLinks />
            </div>
          </li>
        </ul>
      </div>
    </section>

    <div class="accent-line" />

    <section v-if="featuredPreview.length" class="py-10">
      <div class="mb-6 flex items-end justify-between gap-4">
        <h2 class="font-display text-3xl font-extrabold tracking-tight text-navy dark:text-gray-100">
          Featured Essays
        </h2>
        <NuxtLink v-if="hasMoreFeatured" to="/posts" class="btn btn-ghost hidden sm:inline-flex">
          View All
        </NuxtLink>
      </div>

      <div class="grid gap-5 lg:grid-cols-2">
        <PostCard
          v-for="(item, index) in featuredPreview"
          :key="item.path"
          :title="item.title"
          :description="item.description"
          :date="item.pubDatetime"
          :tags="item.tags"
          :href="getHref(item)"
          :image="item.image"
          :featured="true"
          class="animate-fade-in opacity-0"
          :class="`stagger-${index + 1}`"
          :style="{ animationFillMode: 'forwards' }"
        />
      </div>

      <div v-if="hasMoreFeatured" class="mt-5 sm:hidden">
        <NuxtLink to="/posts" class="btn btn-ghost">
          View All
        </NuxtLink>
      </div>
    </section>

    <template v-if="recentContent.length">
      <div v-if="featuredPreview.length" class="accent-line" />

      <section class="py-10">
        <h2 class="font-display mb-6 text-3xl font-extrabold tracking-tight text-navy dark:text-gray-100">
          Latest Across Posts & Talks
        </h2>

        <div class="grid gap-6">
          <PostCard
            v-for="(item, index) in recentContent"
            :key="item.path"
            :title="item.title"
            :description="item.description"
            :date="item.pubDatetime"
            :tags="item.tags"
            :href="getHref(item)"
            :image="item.image"
            class="animate-fade-in opacity-0"
            :class="`stagger-${index + 1}`"
            :style="{ animationFillMode: 'forwards' }"
          />
        </div>
      </section>
    </template>

    <div class="flex flex-wrap justify-center gap-3 pb-8 pt-2">
      <NuxtLink
        to="/posts"
        class="btn btn-ghost"
      >
        All Posts
      </NuxtLink>
      <NuxtLink
        to="/tags"
        class="btn btn-ghost"
      >
        Explore Tags
      </NuxtLink>
    </div>
  </div>
</template>
