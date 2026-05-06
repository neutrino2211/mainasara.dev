<script setup lang="ts">
const { setPageTitle } = usePageTitle()
setPageTitle("Mainasara's Talks")

const { data: talks } = await useAsyncData('all-talks', () =>
  queryCollection('talk')
    .where('draft', '<>', true)
    .order('pubDatetime', 'DESC')
    .all()
)

useSeoMeta({
  title: "Talks | Mainasara's Blog",
  description: 'Conference talks and presentations by Mainasara Tsowa',
})
</script>

<template>
  <div id="main-content" class="page-container">
    <section class="py-8">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-navy/60 dark:text-gray-400">
        Public Speaking
      </p>
      <h1 class="mt-2 font-display text-4xl font-extrabold tracking-tight text-navy dark:text-gray-100 sm:text-5xl">
        Talks
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-navy/70 dark:text-gray-300">
        Conference sessions, workshops, and practical breakdowns from the field.
      </p>
    </section>

    <section class="py-4">
      <div v-if="talks?.length" class="grid gap-6">
        <PostCard
          v-for="(talk, index) in talks"
          :key="talk.path"
          :title="talk.title"
          :description="talk.description"
          :date="talk.pubDatetime"
          :tags="talk.tags"
          :href="`/talks${talk.path.replace('/talk', '')}`"
          :image="talk.image"
          :featured="talk.featured"
          class="animate-fade-in opacity-0"
          :class="`stagger-${(index % 5) + 1}`"
          :style="{ animationFillMode: 'forwards' }"
        />
      </div>

      <div v-else class="py-12 text-center text-navy/60 dark:text-gray-400">
        No talks found.
      </div>
    </section>
  </div>
</template>
