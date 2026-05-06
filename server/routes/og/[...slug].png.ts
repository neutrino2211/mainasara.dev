import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { html } from 'satori-html'

// Cache fonts in memory
let fontCache: { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[] | null = null

async function loadFont() {
  if (fontCache) return fontCache

  // Use Inter from Google Fonts (more reliable)
  const [regular, bold] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2').then(r => r.arrayBuffer()),
    fetch('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2').then(r => r.arrayBuffer()),
  ])

  fontCache = [
    { name: 'Inter', data: regular, weight: 400, style: 'normal' },
    { name: 'Inter', data: bold, weight: 700, style: 'normal' },
  ]

  return fontCache
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const title = (query.title as string) || 'Untitled Post'
  const image = query.image as string | undefined

  const fonts = await loadFont()

  // Build the template
  const markup = html`
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; height: 100%; padding: 64px; background: #F6EEE1; font-family: Inter, sans-serif;">
      <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; flex: 1; padding-right: ${image ? '48px' : '0'};">
        <h1 style="color: #012C56; font-size: ${image ? '52px' : '64px'}; font-weight: 700; line-height: 1.2; margin: 0;">
          ${title}
        </h1>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #E14A39;"></div>
          <span style="color: #012C56; font-size: 20px; font-weight: 400; opacity: 0.6;">
            Mainasara's Blog
          </span>
        </div>
      </div>
      ${image ? `
        <div style="width: 280px; height: 280px; border-radius: 16px; overflow: hidden; flex-shrink: 0; border: 4px solid rgba(1, 44, 86, 0.1); display: flex;">
          <img src="${image}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
      ` : ''}
    </div>
  `

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts,
  })

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return pngBuffer
})
