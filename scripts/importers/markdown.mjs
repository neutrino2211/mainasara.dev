export const markdownImporter = {
  id: 'markdown',

  canImport(record) {
    return typeof record?.content === 'string' && record.content.trim().length > 0
  },

  async import({ remoteDoc }) {
    return {
      body: `${remoteDoc.record.content.trim()}\n`,
    }
  },
}
