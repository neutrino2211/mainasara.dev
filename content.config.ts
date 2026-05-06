import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        author: z.string().default('Mainasara Tsowa'),
        pubDatetime: z.string(),
        modDatetime: z.string().optional(),
        featured: z.boolean().optional().default(false),
        draft: z.boolean().optional().default(false),
        tags: z.array(z.string()).default(['others']),
        ogImage: z.string().optional(),
        canonicalURL: z.string().optional(),
        image: z.string().optional(),
      }),
    }),
    talk: defineCollection({
      type: 'page',
      source: 'talk/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        author: z.string().default('Mainasara Tsowa'),
        pubDatetime: z.string(),
        modDatetime: z.string().optional(),
        featured: z.boolean().optional().default(false),
        draft: z.boolean().optional().default(false),
        tags: z.array(z.string()).default(['others']),
        ogImage: z.string().optional(),
        canonicalURL: z.string().optional(),
        image: z.string().optional(),
      }),
    }),
  },
})
