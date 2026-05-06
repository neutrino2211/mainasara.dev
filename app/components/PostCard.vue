<script setup lang="ts">
interface Props {
  title: string
  description: string
  date: string
  tags?: string[]
  href: string
  featured?: boolean
  image?: string
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  return new Date(props.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})
</script>

<template>
  <article class="card group" :class="{ 'md:flex md:items-start md:gap-6': image }">
    <!-- Thumbnail -->
    <div v-if="image" class="mb-4 md:mb-0 md:w-44 md:shrink-0">
      <NuxtLink :to="href">
        <img
          :src="image"
          :alt="title"
          class="h-32 w-full border-2 border-navy/35 object-cover md:h-28 dark:border-gray-500/60"
        />
      </NuxtLink>
    </div>

    <div class="flex-1">
      <!-- Featured badge -->
      <div
        v-if="featured"
        class="absolute right-3 top-3 rounded-full border border-coral/30 bg-coral/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-coral dark:border-cyan-accent/40 dark:bg-cyan-accent/15 dark:text-cyan-accent"
      >
        Featured
      </div>

      <NuxtLink :to="href" class="block">
        <!-- Date -->
        <time
          :datetime="date"
          class="inline-flex rounded-full border border-navy/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy/60 dark:border-gray-500/35 dark:text-gray-400"
        >
          {{ formattedDate }}
        </time>

        <!-- Title -->
        <h3 class="font-display mt-3 text-2xl font-extrabold tracking-tight text-navy group-hover:text-coral dark:text-gray-100 dark:group-hover:text-cyan-accent">
          {{ title }}
          <span class="inline-block transition-transform duration-300 group-hover:translate-x-1">
            &rarr;
          </span>
        </h3>

        <!-- Description -->
        <p class="mt-3 line-clamp-2 text-sm text-navy/75 dark:text-gray-300">
          {{ description }}
        </p>
      </NuxtLink>

      <!-- Tags -->
      <div v-if="tags?.length" class="mt-4 flex flex-wrap gap-2">
        <NuxtLink
          v-for="tag in tags.slice(0, 3)"
          :key="tag"
          :to="`/tags/${tag}`"
          class="tag"
          @click.stop
        >
          #{{ tag }}
        </NuxtLink>
        <span
          v-if="tags.length > 3"
          class="border-2 border-navy/25 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.06em] text-navy/55 dark:border-gray-500/60 dark:text-gray-500"
        >
          +{{ tags.length - 3 }} more
        </span>
      </div>
    </div>
  </article>
</template>
