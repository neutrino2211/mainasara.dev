<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  side?: 'left' | 'right' | 'auto'
}>(), {
  title: '',
  side: 'auto',
})
</script>

<template>
  <figure class="hashiyya not-prose" :class="`hashiyya--${props.side}`">
    <div class="hashiyya-inline md:hidden">
      <div class="hashiyya-card">
        <p v-if="props.title" class="hashiyya-title">
          {{ props.title }}
        </p>
        <div class="hashiyya-body">
          <slot />
        </div>
      </div>
    </div>

    <aside class="hashiyya-aside hidden md:block" aria-label="Hashiyya note">
      <div class="hashiyya-card">
        <p v-if="props.title" class="hashiyya-title">
          {{ props.title }}
        </p>
        <div class="hashiyya-body">
          <slot />
        </div>
      </div>
    </aside>
  </figure>
</template>
