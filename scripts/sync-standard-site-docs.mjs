#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import process from 'node:process'
import matter from 'gray-matter'
import dotenv from 'dotenv'
import { BskyAgent } from '@atproto/api'
import { importRemoteBody } from './importers/index.mjs'

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
const PUSH_ONLY = process.argv.includes('--push-only')
const PULL_ONLY = process.argv.includes('--pull-only')
const FORCE_PUSH = process.argv.includes('--force-push')
const FORCE_PULL = process.argv.includes('--force-pull')

if (PUSH_ONLY && PULL_ONLY) {
  throw new Error('Cannot use --push-only and --pull-only together.')
}

const RUN_PUSH = !PULL_ONLY
const RUN_PULL = !PUSH_ONLY

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

function uniqueTags(values) {
  return Array.from(new Set(values.map(item => String(item).trim().toLowerCase()).filter(Boolean)))
}

function parseAtUri(atUri = '') {
  if (!atUri.startsWith('at://')) return null
  const parts = atUri.slice('at://'.length).split('/')
  if (parts.length < 3) return null
  return {
    repo: parts[0],
    collection: parts[1],
    rkey: parts[2],
  }
}

function extractHashtags(text = '') {
  const matches = String(text).match(/(^|\s)#([\p{L}\p{N}_-]+)/gu) || []
  return matches.map(item => item.trim().replace(/^#/, '').toLowerCase()).filter(Boolean)
}

async function resolveRemoteTags(remoteDoc, importContext, currentData) {
  const directTags = parseTags(remoteDoc.record.tags)
  if (directTags.length > 0) return uniqueTags(directTags)

  const postUri = remoteDoc.record?.bskyPostRef?.uri
  const cached = postUri ? importContext.postTagCache.get(postUri) : null
  if (cached?.length) return cached

  if (postUri && importContext.agent) {
    const parsed = parseAtUri(postUri)
    if (parsed) {
      try {
        const response = await importContext.agent.com.atproto.repo.getRecord({
          repo: parsed.repo,
          collection: parsed.collection,
          rkey: parsed.rkey,
        })
        const postRecord = response.data?.value || {}
        const tagsFromPost = parseTags(postRecord.tags)
        const tagsFromText = extractHashtags(postRecord.text || '')
        const resolved = uniqueTags([...tagsFromPost, ...tagsFromText])
        if (resolved.length > 0) {
          importContext.postTagCache.set(postUri, resolved)
          return resolved
        }
      } catch (error) {
        if (importContext.verbose) {
          const message = error instanceof Error ? error.message : String(error)
          console.warn(`WARN: failed to resolve post tags from ${postUri}: ${message}`)
        }
      }
    }
  }

  const existingTags = parseTags(currentData?.tags)
  if (existingTags.length > 0) return uniqueTags(existingTags)

  return ['others']
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

const MANUAL_BLOCK_START = '<!-- sync:manual:start -->'
const MANUAL_BLOCK_END = '<!-- sync:manual:end -->'

function extractManualBlocks(markdown = '') {
  const input = String(markdown || '')
  const blocks = []
  let cursor = 0

  while (true) {
    const start = input.indexOf(MANUAL_BLOCK_START, cursor)
    if (start === -1) break
    const end = input.indexOf(MANUAL_BLOCK_END, start + MANUAL_BLOCK_START.length)
    if (end === -1) break
    const block = input.slice(start, end + MANUAL_BLOCK_END.length).trim()
    if (block) blocks.push(block)
    cursor = end + MANUAL_BLOCK_END.length
  }

  return blocks
}

function stripManualBlocks(markdown = '') {
  return String(markdown || '')
    .replace(/<!--\s*sync:manual:start\s*-->[\s\S]*?<!--\s*sync:manual:end\s*-->/g, '')
    .trim()
}

function mergeManualBlocks(importedBody = '', existingBody = '') {
  const normalizedImported = stripManualBlocks(importedBody)
  const manualBlocks = extractManualBlocks(existingBody)
  if (manualBlocks.length === 0) return `${normalizedImported}\n`

  const body = normalizedImported ? `${normalizedImported}\n\n` : ''
  return `${body}${manualBlocks.join('\n\n')}\n`
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

function normalizeRoutePath(value) {
  if (!value) return null
  const normalized = ensureLeadingSlash(String(value).trim().replace(/\\/g, '/').replace(/\/+$/, ''))
  return normalized === '' ? '/' : normalized
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeRecordForHash(record) {
  return {
    $type: record.$type || COLLECTION,
    site: record.site || '',
    path: normalizeRoutePath(record.path) || '',
    title: record.title || '',
    description: record.description || '',
    publishedAt: toIsoDate(record.publishedAt) || '',
    updatedAt: toIsoDate(record.updatedAt) || '',
    tags: parseTags(record.tags).sort(),
    textContent: record.textContent || '',
    content: typeof record.content === 'string' ? record.content : '',
    bskyPostRef: record.bskyPostRef || '',
  }
}

function buildRecordHash(record) {
  return createHash(JSON.stringify(normalizeRecordForHash(record)))
}

async function loadState() {
  if (!(await pathExists(STATE_FILE))) {
    return {
      version: 2,
      updatedAt: new Date().toISOString(),
      documents: {},
    }
  }

  const raw = await fs.readFile(STATE_FILE, 'utf8')
  const parsed = JSON.parse(raw)
  return {
    version: 2,
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

function buildRecord(publicationRef, routePath, data, bodyText, bodyMarkdown = '') {
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
  if (bodyMarkdown) record.content = bodyMarkdown

  return record
}

function summarizeAction(kind, sourceKey, routePath, atUri = '') {
  const suffix = atUri ? ` -> ${atUri}` : ''
  console.log(`${kind.toUpperCase()}: ${sourceKey} (${routePath})${suffix}`)
}

async function collectLocalDocuments(publicationRef) {
  const documents = []

  for (const source of SOURCES) {
    const files = await walkMarkdownFiles(source.dir)

    for (const filePath of files) {
      const raw = await fs.readFile(filePath, 'utf8')
      const parsed = matter(raw)
      if (isDraftLike(parsed.data)) continue

      const relative = path.relative(source.dir, filePath).replace(/\\/g, '/')
      if (relative.startsWith('imported/')) continue

      const routePath = buildRoutePath(source.routePrefix, relative)
      const sourceKey = `${source.kind}/${relative}`
      const markdownBody = parsed.content.trim()
      const textContent = markdownBody || markdownToPlainText(parsed.content)
      const record = buildRecord(publicationRef, routePath, parsed.data, textContent, markdownBody)

      if (!record) {
        console.warn(`SKIP (invalid metadata): ${sourceKey}`)
        continue
      }

      documents.push({
        source,
        filePath,
        sourceKey,
        routePath,
        sourceHash: createHash(raw),
        record,
      })
    }
  }

  return documents.sort((a, b) => a.routePath.localeCompare(b.routePath))
}

async function fetchRemoteDocuments(agent, repo) {
  const docs = []
  let cursor = undefined

  while (true) {
    const response = await agent.com.atproto.repo.listRecords({
      repo,
      collection: COLLECTION,
      limit: 100,
      cursor,
    })

    const records = response.data.records || []
    for (const item of records) {
      const value = item.value || {}
      const routePath = normalizeRoutePath(value.path)
      if (!routePath || !value.title || !value.publishedAt) continue

      docs.push({
        atUri: item.uri,
        rkey: parseRkeyFromAtUri(item.uri),
        routePath,
        record: value,
        recordHash: buildRecordHash(value),
      })
    }

    if (!response.data.cursor) break
    cursor = response.data.cursor
  }

  return docs.sort((a, b) => a.routePath.localeCompare(b.routePath))
}

function sourceFromRoutePath(routePath) {
  for (const source of SOURCES) {
    if (routePath === source.routePrefix || routePath.startsWith(`${source.routePrefix}/`)) {
      const relativeSlug = routePath.slice(source.routePrefix.length).replace(/^\//, '') || 'index'
      const relativeFile = `${relativeSlug}.md`
      return {
        source,
        relativeFile,
        sourceKey: `${source.kind}/${relativeFile}`,
        filePath: path.join(source.dir, relativeFile),
      }
    }
  }

  return null
}

function fallbackSourceFromRemoteDoc(remoteDoc) {
  const rkey = remoteDoc.rkey || parseRkeyFromAtUri(remoteDoc.atUri) || ''
  const fallbackSlug =
    slugify(rkey) ||
    slugify(remoteDoc.record?.title) ||
    slugify((remoteDoc.routePath || '').replace(/\//g, '-')) ||
    'remote-doc'
  const relativeFile = `imported/${fallbackSlug}.md`
  return {
    source: SOURCES[0],
    relativeFile,
    sourceKey: `${SOURCES[0].kind}/${relativeFile}`,
    filePath: path.join(SOURCES[0].dir, relativeFile),
  }
}

async function readLocalFile(filePath) {
  if (!(await pathExists(filePath))) {
    return { exists: false, raw: '', parsed: null, hash: null }
  }

  const raw = await fs.readFile(filePath, 'utf8')
  return {
    exists: true,
    raw,
    parsed: matter(raw),
    hash: createHash(raw),
  }
}

async function upsertLocalMarkdownFromRemote(remoteDoc, fileMeta, importContext) {
  const { dryRun } = importContext
  const local = await readLocalFile(fileMeta.filePath)
  const currentData = local.parsed?.data || {}
  const tags = await resolveRemoteTags(remoteDoc, importContext, currentData)

  const nextData = {
    ...currentData,
    title: String(remoteDoc.record.title),
    description: String(remoteDoc.record.description || currentData.description || ''),
    author: String(currentData.author || 'Mainasara Tsowa'),
    pubDatetime: toIsoDate(remoteDoc.record.publishedAt) || String(currentData.pubDatetime || ''),
    draft: false,
    tags,
  }

  const updatedAt = toIsoDate(remoteDoc.record.updatedAt)
  if (updatedAt) nextData.modDatetime = updatedAt

  const importedBody = await importRemoteBody({
    remoteDoc,
    existingBody: local.parsed?.content || '',
    context: importContext,
  })
  const body = mergeManualBlocks(importedBody.body, local.parsed?.content || '')
  const output = `${matter.stringify(body, nextData).trimEnd()}\n`

  if (!dryRun) {
    await fs.mkdir(path.dirname(fileMeta.filePath), { recursive: true })
    await fs.writeFile(fileMeta.filePath, output, 'utf8')
  }

  return {
    sourceHash: createHash(output),
    action: local.exists ? 'pull-update' : 'pull-create',
  }
}

function buildStateIndex(state) {
  const byRkey = new Map()
  const byRoute = new Map()

  for (const [sourceKey, doc] of Object.entries(state.documents)) {
    if (doc?.rkey) byRkey.set(doc.rkey, { sourceKey, doc })
    if (doc?.routePath) byRoute.set(normalizeRoutePath(doc.routePath), { sourceKey, doc })
  }

  return { byRkey, byRoute }
}

async function runPull({ state, remoteDocs, importContext }) {
  const { dryRun } = importContext
  let created = 0
  let updated = 0
  let skipped = 0
  let conflicted = 0

  const stateIndex = buildStateIndex(state)

  for (const remoteDoc of remoteDocs) {
    const stateMatch =
      (remoteDoc.rkey && stateIndex.byRkey.get(remoteDoc.rkey)) || stateIndex.byRoute.get(remoteDoc.routePath) || null

    let fileMeta = stateMatch
      ? (() => {
          const [kind, ...parts] = stateMatch.sourceKey.split('/')
          const source = SOURCES.find(item => item.kind === kind)
          if (!source || parts.length === 0) return null
          const relativeFile = parts.join('/')
          return {
            source,
            relativeFile,
            sourceKey: stateMatch.sourceKey,
            filePath: path.join(source.dir, relativeFile),
          }
        })()
      : sourceFromRoutePath(remoteDoc.routePath)

    if (!fileMeta) fileMeta = fallbackSourceFromRemoteDoc(remoteDoc)

    const local = await readLocalFile(fileMeta.filePath)
    const stateDoc = state.documents[fileMeta.sourceKey]

    if (!FORCE_PULL && !stateDoc && local.exists) {
      conflicted += 1
      console.warn(
        `CONFLICT (pull): ${fileMeta.sourceKey} exists locally without sync state. Skipping to avoid overwrite; rerun with --force-pull to replace local content.`,
      )
      continue
    }

    if (!FORCE_PULL && stateDoc?.recordHash && stateDoc.recordHash === remoteDoc.recordHash && local.exists) {
      skipped += 1
      if (VERBOSE) summarizeAction('pull-skip', fileMeta.sourceKey, remoteDoc.routePath, remoteDoc.atUri)
      continue
    }

    const localChangedSinceLastSync = !!(stateDoc?.sourceHash && local.hash && stateDoc.sourceHash !== local.hash)
    const remoteChangedSinceLastSync = !!(stateDoc?.recordHash && stateDoc.recordHash !== remoteDoc.recordHash)

    if (!FORCE_PULL && localChangedSinceLastSync && remoteChangedSinceLastSync) {
      conflicted += 1
      console.warn(`CONFLICT (pull): ${fileMeta.sourceKey} changed locally and remotely. Use --force-pull.`)
      continue
    }

    if (dryRun) {
      if (local.exists) updated += 1
      else created += 1
      summarizeAction(local.exists ? 'pull-update' : 'pull-create', fileMeta.sourceKey, remoteDoc.routePath, remoteDoc.atUri)
      continue
    }

    const result = await upsertLocalMarkdownFromRemote(remoteDoc, fileMeta, importContext)
    state.documents[fileMeta.sourceKey] = {
      atUri: remoteDoc.atUri,
      rkey: remoteDoc.rkey,
      sourceHash: result.sourceHash,
      recordHash: remoteDoc.recordHash,
      routePath: remoteDoc.routePath,
      title: remoteDoc.record.title,
      updatedAt: new Date().toISOString(),
    }

    if (result.action === 'pull-create') created += 1
    else updated += 1
    summarizeAction(result.action, fileMeta.sourceKey, remoteDoc.routePath, remoteDoc.atUri)
  }

  return { created, updated, skipped, conflicted, total: remoteDocs.length }
}

async function runPush({ state, localDocs, remoteByRkey, repo, agent, dryRun }) {
  let created = 0
  let updated = 0
  let skipped = 0
  let conflicted = 0

  for (const doc of localDocs) {
    const current = state.documents[doc.sourceKey]
    const routePath = current?.routePath ? normalizeRoutePath(current.routePath) : doc.routePath
    const record = {
      ...doc.record,
      path: routePath,
    }

    if (current?.sourceHash === doc.sourceHash) {
      skipped += 1
      if (VERBOSE) summarizeAction('skip', doc.sourceKey, routePath, current.atUri)
      continue
    }

    const desiredRkey = current?.rkey || parseRkeyFromAtUri(current?.atUri) || stableRkey(routePath)
    const remote = remoteByRkey.get(desiredRkey)

    const localChangedSinceLastSync = !!(current?.sourceHash && current.sourceHash !== doc.sourceHash)
    const remoteChangedSinceLastSync = !!(current?.recordHash && remote?.recordHash && current.recordHash !== remote.recordHash)

    if (!FORCE_PUSH && localChangedSinceLastSync && remoteChangedSinceLastSync) {
      conflicted += 1
      console.warn(`CONFLICT (push): ${doc.sourceKey} changed locally and remotely. Use --force-push.`)
      continue
    }

    if (dryRun) {
      const action = current ? 'update' : 'create'
      if (action === 'create') created += 1
      else updated += 1
      summarizeAction(action, doc.sourceKey, routePath, current?.atUri || '')
      continue
    }

    if (current?.rkey || remote) {
      const put = await agent.com.atproto.repo.putRecord({
        repo,
        collection: COLLECTION,
        rkey: desiredRkey,
        record,
      })

      const atUri = put.data.uri || current?.atUri || `at://${repo}/${COLLECTION}/${desiredRkey}`
      state.documents[doc.sourceKey] = {
        atUri,
        rkey: desiredRkey,
        sourceHash: doc.sourceHash,
        recordHash: buildRecordHash(record),
        routePath,
        title: record.title,
        updatedAt: new Date().toISOString(),
      }
      updated += 1
      summarizeAction('update', doc.sourceKey, routePath, atUri)
      continue
    }

    try {
      const createdRecord = await agent.com.atproto.repo.createRecord({
        repo,
        collection: COLLECTION,
        rkey: desiredRkey,
        record,
      })

      const atUri = createdRecord.data.uri
      state.documents[doc.sourceKey] = {
        atUri,
        rkey: desiredRkey,
        sourceHash: doc.sourceHash,
        recordHash: buildRecordHash(record),
        routePath,
        title: record.title,
        updatedAt: new Date().toISOString(),
      }
      created += 1
      summarizeAction('create', doc.sourceKey, routePath, atUri)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!/RecordAlreadyExists|already exists/i.test(message)) {
        throw error
      }

      const put = await agent.com.atproto.repo.putRecord({
        repo,
        collection: COLLECTION,
        rkey: desiredRkey,
        record,
      })
      const atUri = put.data.uri || `at://${repo}/${COLLECTION}/${desiredRkey}`
      state.documents[doc.sourceKey] = {
        atUri,
        rkey: desiredRkey,
        sourceHash: doc.sourceHash,
        recordHash: buildRecordHash(record),
        routePath,
        title: record.title,
        updatedAt: new Date().toISOString(),
      }
      updated += 1
      summarizeAction('update', doc.sourceKey, routePath, atUri)
    }
  }

  return { created, updated, skipped, conflicted, total: localDocs.length }
}

async function main() {
  const service = process.env.ATPROTO_SERVICE || 'https://bsky.social'
  const publicationRef = process.env.STANDARD_SITE_PUBLICATION || 'https://blog.mainasara.dev'

  const state = await loadState()

  let agent = null
  let repo = null
  let repoDid = null
  let remoteDocs = []

  const shouldLogin = RUN_PULL || !DRY_RUN

  if (shouldLogin) {
    const identifier = requireEnv('ATPROTO_IDENTIFIER')
    const password = requireEnv('ATPROTO_APP_PASSWORD')
    agent = new BskyAgent({ service })
    await agent.login({ identifier, password })

    repo = process.env.ATPROTO_REPO || agent.session?.did || identifier
    if (!repo) {
      throw new Error('Could not resolve repository DID/handle for record sync.')
    }
    repoDid = agent.session?.did || (String(repo).startsWith('did:') ? repo : null)

    remoteDocs = await fetchRemoteDocuments(agent, repo)
  }

  const importContext = {
    agent,
    repoDid,
    rootDir: ROOT_DIR,
    dryRun: DRY_RUN,
    verbose: VERBOSE,
    assetCache: new Map(),
    postTagCache: new Map(),
  }

  let pullSummary = null
  if (RUN_PULL) {
    pullSummary = await runPull({ state, remoteDocs, importContext })
  }

  let pushSummary = null
  if (RUN_PUSH) {
    const localDocs = await collectLocalDocuments(publicationRef)
    const remoteByRkey = new Map(remoteDocs.filter(doc => doc.rkey).map(doc => [doc.rkey, doc]))

    if (localDocs.length === 0) {
      console.log('No valid markdown documents found to push.')
    } else {
      pushSummary = await runPush({
        state,
        localDocs,
        remoteByRkey,
        repo,
        agent,
        dryRun: DRY_RUN,
      })
    }
  }

  if (!DRY_RUN) {
    state.updatedAt = new Date().toISOString()
    await saveState(state)
  }

  const mode = RUN_PULL && RUN_PUSH ? 'BIDIRECTIONAL' : RUN_PULL ? 'PULL' : 'PUSH'
  if (pullSummary) {
    console.log(
      `${mode} PULL: created=${pullSummary.created}, updated=${pullSummary.updated}, skipped=${pullSummary.skipped}, conflicted=${pullSummary.conflicted}, total=${pullSummary.total}`,
    )
  }
  if (pushSummary) {
    console.log(
      `${mode} PUSH: created=${pushSummary.created}, updated=${pushSummary.updated}, skipped=${pushSummary.skipped}, conflicted=${pushSummary.conflicted}, total=${pushSummary.total}`,
    )
  }

  if (DRY_RUN) {
    console.log('No records or files were modified (--dry-run).')
  } else {
    console.log(`State saved to: ${STATE_FILE}`)
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
