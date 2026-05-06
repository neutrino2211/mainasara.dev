<script setup lang="ts">
const { setPageTitle } = usePageTitle()
setPageTitle("Mainasara's Posts")

const { data: posts } = await useAsyncData('all-posts', () =>
  queryCollection('blog')
    .where('draft', '<>', true)
    .order('pubDatetime', 'DESC')
    .all()
)

useSeoMeta({
  title: "Posts | Mainasara's Blog",
  description: 'All blog posts by Mainasara Tsowa',
})
</script>

<template>
  <div id="main-content" class="page-container">
    <section class="py-8">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-navy/60 dark:text-gray-400">
        Archive
      </p>
      <h1 class="mt-2 font-display text-4xl font-extrabold tracking-tight text-navy dark:text-gray-100 sm:text-5xl">
        Writing
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-navy/70 dark:text-gray-300">
        Long-form posts on reverse engineering, security, software design, and implementation notes.
      </p>
    </section>

    <section class="py-4">
      <div v-if="posts?.length" class="grid gap-6">
        <PostCard
          v-for="(post, index) in posts"
          :key="post.path"
          :title="post.title"
          :description="post.description"
          :date="post.pubDatetime"
          :tags="post.tags"
          :href="`/posts${post.path.replace('/blog', '')}`"
          :image="post.image"
          :featured="post.featured"
          class="animate-fade-in opacity-0"
          :class="`stagger-${(index % 5) + 1}`"
          :style="{ animationFillMode: 'forwards' }"
        />
      </div>

      <div v-else class="py-12 text-center text-navy/60 dark:text-gray-400">
        No posts found.
      </div>
    </section>
  </div>
</template>
