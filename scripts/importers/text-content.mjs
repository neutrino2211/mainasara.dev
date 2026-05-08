export const textContentImporter = {
  id: 'text-content',

  canImport(record) {
    return typeof record?.textContent === 'string' && record.textContent.trim().length > 0
  },

  async import({ remoteDoc, existingBody = '' }) {
    const preferred = remoteDoc.record.textContent.trim()
    if (preferred) {
      return { body: `${preferred}\n` }
    }

    if (existingBody.trim()) {
      return { body: `${existingBody.trim()}\n` }
    }

    return { body: '\n' }
  },
}
