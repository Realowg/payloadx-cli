import { readFileSync } from 'node:fs'
import { basename, extname } from 'node:path'

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
}

function mimeFromExt(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  return MIME_MAP[ext] ?? 'application/octet-stream'
}

export function isUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://')
}

export function resolveFileArg(
  input: string,
): { type: 'url'; url: string } | { type: 'blob'; blob: Blob; filename: string } {
  if (isUrl(input)) {
    return { type: 'url', url: input }
  }

  const buffer = readFileSync(input)
  const mime = mimeFromExt(input)
  const filename = basename(input)
  const blob = new File([buffer], filename, { type: mime })

  return { type: 'blob', blob, filename }
}
