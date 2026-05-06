// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
    '@nuxt/icon',
  ],

  app: {
    head: {
      title: "Mainasara's Blog",
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A place where Mainasara says things.' },
        { name: 'author', content: 'Mainasara Tsowa' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=JetBrains+Mono:ital,wght@0,400;0,600;1,400&display=swap',
        },
      ],
      script: [
        { src: 'https://tfpb.techforpalestine.org/lib/banner.min.js', defer: true },
        { src: 'https://swetrix.org/swetrix.js', defer: true },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  content: {
    build: {
      markdown: {
        toc: { depth: 3 },
        highlight: {
          theme: {
            default: 'github-light',
            dark: 'github-dark',
          },
          langs: [
            'js',
            'jsx',
            'json',
            'ts',
            'tsx',
            'vue',
            'css',
            'html',
            'bash',
            'md',
            'mdc',
            'yaml',
            'c',
            'cpp',
          ],
        },
      },
    },
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true },
    '/posts/**': { prerender: true },
    '/talks/**': { prerender: true },
    '/tags/**': { prerender: true },
    '/about': { prerender: true },
  },

  nitro: {
    prerender: {
      routes: ['/rss.xml'],
    },
  },

  compatibilityDate: '2025-03-18',
})
