<script setup lang="ts">
interface Props {
  tags: string[]
  showCount?: boolean
  counts?: Record<string, number>
}

const props = withDefaults(defineProps<Props>(), {
  showCount: false,
})
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <NuxtLink
      v-for="tag in tags"
      :key="tag"
      :to="`/tags/${tag}`"
      class="tag"
    >
      #{{ tag }}
      <span
        v-if="showCount && counts?.[tag]"
        class="ml-1 text-xs opacity-60"
      >
        ({{ counts[tag] }})
      </span>
    </NuxtLink>
  </div>
</template>
