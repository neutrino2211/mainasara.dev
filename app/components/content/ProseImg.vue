<script setup lang="ts">
defineProps<{
  src?: string
  alt?: string
  title?: string
  width?: string | number
  height?: string | number
}>()
</script>

<template>
  <figure class="prose-image">
    <img
      :src="src"
      :alt="alt || ''"
      :title="title"
      :width="width"
      :height="height"
      loading="lazy"
    >
    <figcaption v-if="alt" class="prose-image__caption">
      {{ alt }}
    </figcaption>
  </figure>
</template>
