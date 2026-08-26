export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024

const ALLOWED: Record<string, string[]> = {
  document: ['pdf', 'jpg', 'jpeg', 'png'],
  office: ['pdf', 'doc', 'docx'],
  photo: ['jpg', 'jpeg', 'png'],
  spreadsheet: ['xlsx', 'xls', 'csv'],
}

export function validateUploadFile(
  file: File,
  kind: keyof typeof ALLOWED = 'document',
  maxBytes = MAX_DOCUMENT_BYTES,
): string | null {
  if (file.size > maxBytes) {
    return 'Fichier trop volumineux (maximum 8 Mo).'
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED[kind].includes(ext)) {
    return 'Type de fichier non autorisé.'
  }
  return null
}
