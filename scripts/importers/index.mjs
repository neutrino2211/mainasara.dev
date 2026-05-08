import { leafletImporter } from './leaflet.mjs'
import { markdownImporter } from './markdown.mjs'
import { textContentImporter } from './text-content.mjs'

const IMPORTERS = [leafletImporter, markdownImporter, textContentImporter]

function normalizeBody(body) {
  if (typeof body !== 'string') return '\n'
  return `${body.trimEnd()}\n`
}

export async function importRemoteBody({ remoteDoc, existingBody = '', context }) {
  for (const importer of IMPORTERS) {
    if (!importer.canImport(remoteDoc.record)) continue
    const result = await importer.import({ remoteDoc, existingBody, context })
    if (result?.body != null) {
      return {
        importer: importer.id,
        body: normalizeBody(result.body),
      }
    }
  }

  if (existingBody.trim()) {
    return { importer: 'existing-body-fallback', body: normalizeBody(existingBody) }
  }

  return { importer: 'empty', body: '\n' }
}

export { IMPORTERS }
