import fs from 'node:fs/promises'
import path from 'node:path'

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseDidFromAtUri(atUri = '') {
  if (!atUri.startsWith('at://')) return null
  const withoutPrefix = atUri.slice('at://'.length)
  const segments = withoutPrefix.split('/')
  return segments[0] || null
}

function mimeToExtension(mimeType = '') {
  const normalized = String(mimeType).toLowerCase()
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'jpg'
  if (normalized === 'image/png') return 'png'
  if (normalized === 'image/webp') return 'webp'
  if (normalized === 'image/gif') return 'gif'
  if (normalized === 'image/svg+xml') return 'svg'
  if (normalized === 'image/avif') return 'avif'
  if (normalized.startsWith('image/')) return normalized.split('/')[1] || 'img'
  return 'bin'
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateText(value, max = 320) {
  const text = normalizeWhitespace(value)
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

function toMdcStringLiteral(value) {
  const normalized = normalizeWhitespace(value)
  const escaped = normalized
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
  return `"${escaped}"`
}

function escapeMarkdownAlt(value) {
  return String(value || '')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

function asBuffer(data) {
  if (!data) return null
  if (Buffer.isBuffer(data)) return data
  if (data instanceof Uint8Array) return Buffer.from(data)
  if (data instanceof ArrayBuffer) return Buffer.from(data)
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  if (typeof data === 'string') return Buffer.from(data)
  return null
}

async function blobResponseToBuffer(response) {
  const direct = asBuffer(response?.data)
  if (direct) return direct

  const arrayBufferFn = response?.data?.arrayBuffer
  if (typeof arrayBufferFn === 'function') {
    const raw = await response.data.arrayBuffer()
    return Buffer.from(raw)
  }

  throw new Error('Unsupported blob response type from atproto sync.getBlob')
}

function getBlobCid(blob) {
  const ref = blob?.ref
  if (!ref) return null

  if (typeof ref === 'string') return ref
  if (typeof ref.$link === 'string') return ref.$link
  if (typeof ref.toString === 'function') {
    const value = String(ref.toString())
    if (value && value !== '[object Object]') return value
  }
  return null
}

async function downloadBlob({ remoteDoc, blob, context, variant = 'image' }) {
  const cid = getBlobCid(blob)
  if (!cid) return null

  const did = parseDidFromAtUri(remoteDoc.atUri) || context.repoDid
  if (!did || !context.agent) return null

  const cacheKey = `${did}:${cid}`
  if (context.assetCache.has(cacheKey)) return context.assetCache.get(cacheKey)

  const docKey = slugify(remoteDoc.rkey || remoteDoc.routePath || remoteDoc.record?.title || 'imported') || 'imported'
  const ext = mimeToExtension(blob?.mimeType)
  const fileName = `${variant}-${cid}.${ext}`
  const relativePath = path.posix.join('assets', 'imported', docKey, fileName)
  const publicPath = `/${relativePath}`
  const absolutePath = path.join(context.rootDir, 'public', ...relativePath.split('/'))

  if (!context.dryRun) {
    try {
      await fs.access(absolutePath)
      context.assetCache.set(cacheKey, publicPath)
      return publicPath
    } catch {
      // File does not exist yet.
    }

    try {
      const response = await context.agent.com.atproto.sync.getBlob({ did, cid })
      const bytes = await blobResponseToBuffer(response)
      await fs.mkdir(path.dirname(absolutePath), { recursive: true })
      await fs.writeFile(absolutePath, bytes)
      context.assetCache.set(cacheKey, publicPath)
      return publicPath
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (context.verbose) {
        console.warn(`WARN: failed to download blob ${cid} (${variant}) for ${remoteDoc.atUri}: ${message}`)
      }
      return null
    }
  }

  context.assetCache.set(cacheKey, publicPath)
  return publicPath
}

function leafletTextFromFacets(plaintext = '') {
  return String(plaintext || '')
}

async function leafletBlockToMarkdown(block, remoteDoc, context, depth = 0) {
  if (!block || typeof block !== 'object') return ''
  const type = String(block.$type || '')

  if (type === 'pub.leaflet.blocks.text') {
    return leafletTextFromFacets(block.plaintext)
  }

  if (type === 'pub.leaflet.blocks.header') {
    const level = Math.min(Math.max(Number(block.level) || 1, 1), 6)
    const text = leafletTextFromFacets(block.plaintext)
    return text ? `${'#'.repeat(level)} ${text}` : ''
  }

  if (type === 'pub.leaflet.blocks.website') {
    const src = normalizeWhitespace(block.src)
    const title = normalizeWhitespace(block.title || src || 'link')
    const description = truncateText(block.description || '', 320)
    if (!src) return ''

    const previewPath = await downloadBlob({
      remoteDoc,
      blob: block.previewImage,
      context,
      variant: 'preview',
    })

    const attrs = [
      `url=${toMdcStringLiteral(src)}`,
      `title=${toMdcStringLiteral(title)}`,
      description ? `description=${toMdcStringLiteral(description)}` : '',
      previewPath ? `image=${toMdcStringLiteral(previewPath)}` : '',
    ]
      .filter(Boolean)
      .join(' ')

    return `::LinkPreview{${attrs}}\n::`
  }

  if (type === 'pub.leaflet.blocks.image') {
    const alt = normalizeWhitespace(block.alt || 'image')
    const imagePath = await downloadBlob({
      remoteDoc,
      blob: block.image,
      context,
      variant: 'image',
    })

    if (!imagePath) return alt || ''
    return `![${escapeMarkdownAlt(alt)}](${imagePath})`
  }

  if (type === 'pub.leaflet.blocks.unorderedList') {
    const children = Array.isArray(block.children) ? block.children : []
    const lines = []
    for (const item of children) {
      const content = await leafletBlockToMarkdown(item?.content, remoteDoc, context, depth + 1)
      if (content) {
        lines.push(`${'  '.repeat(depth)}- ${content}`)
      }

      const nestedChildren = Array.isArray(item?.children) ? item.children : []
      for (const nested of nestedChildren) {
        const nestedContent = await leafletBlockToMarkdown(nested?.content, remoteDoc, context, depth + 1)
        if (nestedContent) {
          lines.push(`${'  '.repeat(depth + 1)}- ${nestedContent}`)
        }
      }
    }
    return lines.join('\n')
  }

  return leafletTextFromFacets(block.plaintext)
}

async function leafletContentToMarkdown(content, remoteDoc, context) {
  if (!content || typeof content !== 'object') return ''
  if (content.$type !== 'pub.leaflet.content') return ''

  const pages = Array.isArray(content.pages) ? content.pages : []
  const chunks = []
  for (const page of pages) {
    const blocks = Array.isArray(page?.blocks) ? page.blocks : []
    for (const wrapper of blocks) {
      const rendered = (await leafletBlockToMarkdown(wrapper?.block, remoteDoc, context)).trim()
      if (rendered) chunks.push(rendered)
    }
  }

  return chunks.join('\n\n').trim()
}

export const leafletImporter = {
  id: 'leaflet',

  canImport(record) {
    return Boolean(record?.content && typeof record.content === 'object' && record.content.$type === 'pub.leaflet.content')
  },

  async import({ remoteDoc, existingBody = '', context }) {
    const markdown = await leafletContentToMarkdown(remoteDoc.record.content, remoteDoc, context)
    if (markdown) {
      return { body: `${markdown}\n` }
    }

    if (existingBody.trim()) {
      return { body: `${existingBody.trim()}\n` }
    }

    return { body: '\n' }
  },
}
