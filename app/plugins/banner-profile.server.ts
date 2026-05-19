import { getHeader, getRequestIP, type H3Event } from 'h3'

const TARGET_COUNTRY_CODES = new Set(['IL', 'IN', 'AE'])
const GEO_CACHE_TTL_MS = 15 * 60 * 1000
const geoCache = new Map<string, { countryCode: string | null, expiresAt: number }>()

function normalizeCountryCode(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  if (normalized.length !== 2) return null
  if (normalized === 'XX') return null
  return normalized
}

function getCountryFromEdgeHeaders(event: H3Event): string | null {
  const headerKeys = [
    'cf-ipcountry',
    'x-vercel-ip-country',
    'x-country-code',
    'x-geo-country',
  ]

  for (const key of headerKeys) {
    const countryCode = normalizeCountryCode(getHeader(event, key))
    if (countryCode) return countryCode
  }

  return null
}

function isPrivateOrLocalIp(ip = ''): boolean {
  const normalized = ip.trim()
  if (!normalized) return true

  if (normalized === '127.0.0.1' || normalized === '::1' || normalized === 'localhost') return true
  if (normalized.startsWith('10.') || normalized.startsWith('192.168.')) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  if (normalized.startsWith('fe80:')) return true
  return false
}

function normalizeIpCandidate(value: string): string {
  const candidate = value.trim()
  if (!candidate) return ''
  if (candidate.includes(':') && candidate.includes('.') && candidate.startsWith('::ffff:')) {
    return candidate.slice('::ffff:'.length)
  }
  return candidate
}

function extractClientIp(event: H3Event): string {
  const xRealIp = normalizeIpCandidate(String(getHeader(event, 'x-real-ip') || ''))
  if (xRealIp) return xRealIp

  const xForwardedFor = String(getHeader(event, 'x-forwarded-for') || '')
  if (xForwardedFor) {
    const firstForwarded = normalizeIpCandidate(xForwardedFor.split(',')[0] || '')
    if (firstForwarded) return firstForwarded
  }

  const resolvedIp = normalizeIpCandidate(getRequestIP(event, { xForwardedFor: true }) || '')
  return resolvedIp
}

async function resolveCountryCode(event: H3Event): Promise<string | null> {
  const headerCountry = getCountryFromEdgeHeaders(event)
  if (headerCountry) return headerCountry

  const ip = extractClientIp(event)
  if (!ip || isPrivateOrLocalIp(ip)) return null

  const now = Date.now()
  const cached = geoCache.get(ip)
  if (cached && cached.expiresAt > now) return cached.countryCode

  try {
    const response = await $fetch<{ country_code?: string }>(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      timeout: 1500,
    })
    const countryCode = normalizeCountryCode(response?.country_code)
    geoCache.set(ip, { countryCode, expiresAt: now + GEO_CACHE_TTL_MS })
    return countryCode
  } catch {
    geoCache.set(ip, { countryCode: null, expiresAt: now + 60 * 1000 })
    return null
  }
}

export default defineNuxtPlugin(async nuxtApp => {
  const event = nuxtApp.ssrContext?.event
  if (!event) return

  const bannerRequiresUnlock = useState<boolean>('ceasefire-banner-requires-unlock', () => false)
  const countryCode = await resolveCountryCode(event)
  bannerRequiresUnlock.value = countryCode ? TARGET_COUNTRY_CODES.has(countryCode) : false
})
