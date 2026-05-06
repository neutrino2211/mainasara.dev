#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import process from 'node:process'
import matter from 'gray-matter'
import dotenv from 'dotenv'
import { BskyAgent } from '@atproto/api'

dotenv.config({ quiet: true })

const ROOT_DIR = process.cwd()
const COLLECTION = 'site.standard.document'
const STATE_FILE = path.join(ROOT_DIR, '.data', 'standard-site-map.json')
const SOURCES = [
  { kind: 'blog', dir: path.join(ROOT_DIR, 'content', 'blog'), routePrefix: '/posts' },
  { kind: 'talk', dir: path.join(ROOT_DIR, 'content', 'talk'), routePrefix: '/talks' },
]

const DRY_RUN = process.argv.includes('--dry-run')
const VERBOSE = process.argv.includes('--verbose')

function createHash(input) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function stableRkey(routePath) {
  return `doc-${crypto.createHash('sha1').update(routePath).digest('hex').slice(0, 20)}`
}

function toIsoDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function parseTags(value) {
  if (!Array.isArray(value)) return []
  return value
    .map(item => String(item).trim().replace(/^#/, ''))
    .filter(Boolean)
}

function markdownToPlainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\r/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function ensureLeadingSlash(value) {
  if (!value) return value
  return value.startsWith('/') ? value : `/${value}`
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function walkMarkdownFiles(dir) {
  if (!(await pathExists(dir))) return []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async entry => {
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) return walkMarkdownFiles(absolute)
      if (entry.isFile() && absolute.endsWith('.md')) return [absolute]
      return []
    }),
  )
  return nested.flat()
}

function parseRkeyFromAtUri(atUri) {
  if (!atUri) return null
  const parts = atUri.split('/')
  return parts[parts.length - 1] || null
}

async function loadState() {
  if (!(await pathExists(STATE_FILE))) {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      documents: {},
    }
  }

  const raw = await fs.readFile(STATE_FILE, 'utf8')
  const parsed = JSON.parse(raw)
  return {
    version: 1,
    updatedAt: parsed.updatedAt || new Date().toISOString(),
    documents: parsed.documents || {},
  }
}

async function saveState(state) {
  const stateDir = path.dirname(STATE_FILE)
  await fs.mkdir(stateDir, { recursive: true })
  await fs.writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

function requireEnv(name, fallback = '') {
  const value = process.env[name] || fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function isDraftLike(frontmatter) {
  if (frontmatter?.draft === true) return true
  if (frontmatter?.published === false) return true
  return false
}

function buildRoutePath(routePrefix, relativeFilePath) {
  const normalized = relativeFilePath.replace(/\\/g, '/')
  const slug = normalized.replace(/\.md$/i, '')
  const joined = `${routePrefix}/${slug}`.replace(/\/+/g, '/')
  if (joined.endsWith('/index')) {
    return joined.slice(0, -('/index'.length)) || '/'
  }
  return joined
}

function buildRecord(publicationRef, routePath, data, bodyText) {
  const publishedAt = toIsoDate(data.pubDatetime)
  if (!publishedAt) return null

  if (!data.title || !data.description) return null

  const tags = parseTags(data.tags)

  const record = {
    $type: COLLECTION,
    site: publicationRef,
    path: ensureLeadingSlash(routePath),
    title: String(data.title),
    description: String(data.description),
    publishedAt,
    textContent: bodyText,
  }

  const updatedAt = toIsoDate(data.modDatetime)
  if (updatedAt) record.updatedAt = updatedAt
  if (tags.length > 0) record.tags = tags

  return record
}

function summarizeAction(kind, sourceKey, routePath, atUri = '') {
  const suffix = atUri ? ` -> ${atUri}` : ''
  console.log(`${kind.toUpperCase()}: ${sourceKey} (${routePath})${suffix}`)
}

async function collectDocuments(publicationRef) {
  const documents = []

  for (const source of SOURCES) {
    const files = await walkMarkdownFiles(source.dir)

    for (const filePath of files) {
      const raw = await fs.readFile(filePath, 'utf8')
      const parsed = matter(raw)
      if (isDraftLike(parsed.data)) continue

      const relative = path.relative(source.dir, filePath)
      const routePath = buildRoutePath(source.routePrefix, relative)
      const sourceKey = `${source.kind}/${relative.replace(/\\/g, '/')}`
      const textContent = markdownToPlainText(parsed.content)
      const record = buildRecord(publicationRef, routePath, parsed.data, textContent)

      if (!record) {
        console.warn(`SKIP (invalid metadata): ${sourceKey}`)
        continue
      }

      documents.push({
        sourceKey,
        routePath,
        sourceHash: createHash(raw),
        record,
      })
    }
  }

  return documents.sort((a, b) => a.routePath.localeCompare(b.routePath))
}

async function main() {
  const service = process.env.ATPROTO_SERVICE || 'https://bsky.social'
  const publicationRef = process.env.STANDARD_SITE_PUBLICATION || 'https://blog.mainasara.dev'

  const state = await loadState()
  const docs = await collectDocuments(publicationRef)

  if (docs.length === 0) {
    console.log('No valid markdown documents found to sync.')
    return
  }

  let agent = null
  let repo = null

  if (!DRY_RUN) {
    const identifier = requireEnv('ATPROTO_IDENTIFIER')
    const password = requireEnv('ATPROTO_APP_PASSWORD')
    agent = new BskyAgent({ service })
    await agent.login({ identifier, password })

    repo = process.env.ATPROTO_REPO || agent.session?.did || identifier
    if (!repo) {
      throw new Error('Could not resolve repository DID/handle for record sync.')
    }
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const doc of docs) {
    const current = state.documents[doc.sourceKey]

    if (current?.sourceHash === doc.sourceHash) {
      skipped += 1
      if (VERBOSE) summarizeAction('skip', doc.sourceKey, doc.routePath, current.atUri)
      continue
    }

    const desiredRkey = current?.rkey || parseRkeyFromAtUri(current?.atUri) || stableRkey(doc.routePath)

    if (DRY_RUN) {
      const action = current ? 'update' : 'create'
      if (action === 'create') created += 1
      else updated += 1
      summarizeAction(action, doc.sourceKey, doc.routePath, current?.atUri || '')
      continue
    }

    if (current?.rkey) {
      const put = await agent.com.atproto.repo.putRecord({
        repo,
        collection: COLLECTION,
        rkey: current.rkey,
        record: doc.record,
      })

      const atUri = put.data.uri || current.atUri
      state.documents[doc.sourceKey] = {
        atUri,
        rkey: current.rkey,
        sourceHash: doc.sourceHash,
        routePath: doc.routePath,
        title: doc.record.title,
        updatedAt: new Date().toISOString(),
      }
      updated += 1
      summarizeAction('update', doc.sourceKey, doc.routePath, atUri)
      continue
    }

    try {
      const createdRecord = await agent.com.atproto.repo.createRecord({
        repo,
        collection: COLLECTION,
        rkey: desiredRkey,
        record: doc.record,
      })

      const atUri = createdRecord.data.uri
      state.documents[doc.sourceKey] = {
        atUri,
        rkey: desiredRkey,
        sourceHash: doc.sourceHash,
        routePath: doc.routePath,
        title: doc.record.title,
        updatedAt: new Date().toISOString(),
      }
      created += 1
      summarizeAction('create', doc.sourceKey, doc.routePath, atUri)
    } catch (error) {
      // If the deterministic rkey already exists, treat this as an update path.
      const message = error instanceof Error ? error.message : String(error)
      if (!/RecordAlreadyExists|already exists/i.test(message)) {
        throw error
      }

      const put = await agent.com.atproto.repo.putRecord({
        repo,
        collection: COLLECTION,
        rkey: desiredRkey,
        record: doc.record,
      })
      const atUri = put.data.uri || `at://${repo}/${COLLECTION}/${desiredRkey}`
      state.documents[doc.sourceKey] = {
        atUri,
        rkey: desiredRkey,
        sourceHash: doc.sourceHash,
        routePath: doc.routePath,
        title: doc.record.title,
        updatedAt: new Date().toISOString(),
      }
      updated += 1
      summarizeAction('update', doc.sourceKey, doc.routePath, atUri)
    }
  }

  if (!DRY_RUN) {
    state.updatedAt = new Date().toISOString()
    await saveState(state)
  }

  const summaryPrefix = DRY_RUN ? 'DRY RUN' : 'SYNC'
  console.log(
    `${summaryPrefix} COMPLETE: created=${created}, updated=${updated}, skipped=${skipped}, total=${docs.length}`,
  )
  if (DRY_RUN) {
    console.log('No records or state files were modified (--dry-run).')
  } else {
    console.log(`State saved to: ${STATE_FILE}`)
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
