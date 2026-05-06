import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const siteUrl = 'https://blog.mainasara.dev'
  const feedTitle = "Mainasara's Blog"
  const feedDescription = 'A place where Mainasara says things.'

  // Fetch all published content using the new Content v3 API
  const posts = (await queryCollection(event, 'blog')
    .order('pubDatetime', 'DESC')
    .all()).filter(post => post.draft !== true)

  const talks = (await queryCollection(event, 'talk')
    .order('pubDatetime', 'DESC')
    .all()).filter(talk => talk.draft !== true)

  const allContent = [...posts, ...talks].sort(
    (a, b) => new Date(b.pubDatetime).getTime() - new Date(a.pubDatetime).getTime()
  )

  const getHref = (item: any) => {
    if (item.path?.startsWith('/blog')) {
      return `/posts${item.path.replace('/blog', '')}`
    }
    if (item.path?.startsWith('/talk')) {
      return `/talks${item.path.replace('/talk', '')}`
    }
    return item.path || '/'
  }

  const rssItems = allContent
    .map((item) => {
      const link = `${siteUrl}${getHref(item)}`
      const pubDate = new Date(item.pubDatetime).toUTCString()

      return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${item.tags?.map((tag: string) => `<category>${tag}</category>`).join('\n      ') || ''}
    </item>`
    })
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <link>${siteUrl}</link>
    <description>${feedDescription}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`

  setResponseHeader(event, 'Content-Type', 'application/xml')
  return rss
})
