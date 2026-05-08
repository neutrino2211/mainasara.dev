<script setup lang="ts">
const props = withDefaults(defineProps<{
  url: string
  title?: string
  description?: string
  image?: string
}>(), {
  title: '',
  description: '',
  image: '',
})

const host = computed(() => {
  try {
    return new URL(props.url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
})
</script>

<template>
  <figure class="link-preview not-prose">
    <a
      :href="props.url"
      target="_blank"
      rel="noopener noreferrer"
      class="link-preview__card"
    >
      <img
        v-if="props.image"
        :src="props.image"
        :alt="props.title || 'Link preview image'"
        class="link-preview__image"
        loading="lazy"
      >

      <div class="link-preview__body">
        <p v-if="host" class="link-preview__host">
          {{ host }}
        </p>
        <h4 class="link-preview__title">
          {{ props.title || props.url }}
        </h4>
        <p v-if="props.description" class="link-preview__description">
          {{ props.description }}
        </p>
      </div>
    </a>
  </figure>
</template>
