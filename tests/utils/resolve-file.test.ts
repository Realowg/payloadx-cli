import { describe, it, expect } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { resolveFileArg, isUrl } from '../../src/utils/resolve-file.js'

const TMP_DIR = join(process.cwd(), '.test-tmp-file')

describe('isUrl', () => {
  it('returns true for http URLs', () => {
    expect(isUrl('http://example.com/img.png')).toBe(true)
  })

  it('returns true for https URLs', () => {
    expect(isUrl('https://example.com/img.png')).toBe(true)
  })

  it('returns false for local paths', () => {
    expect(isUrl('./hero.png')).toBe(false)
    expect(isUrl('/abs/path.jpg')).toBe(false)
  })
})

describe('resolveFileArg', () => {
  it('returns url type for http URLs', () => {
    const result = resolveFileArg('https://example.com/photo.jpg')
    expect(result.type).toBe('url')
    if (result.type === 'url') {
      expect(result.url).toBe('https://example.com/photo.jpg')
    }
  })

  it('reads local file into a File with correct MIME and name', () => {
    mkdirSync(TMP_DIR, { recursive: true })
    const filePath = join(TMP_DIR, 'test.png')
    writeFileSync(filePath, Buffer.from('fake-png-data'))
    try {
      const result = resolveFileArg(filePath)
      expect(result.type).toBe('blob')
      if (result.type === 'blob') {
        expect(result.filename).toBe('test.png')
        expect(result.blob.type).toBe('image/png')
        expect(result.blob.size).toBeGreaterThan(0)
        expect(result.blob).toBeInstanceOf(File)
        expect((result.blob as File).name).toBe('test.png')
      }
    } finally {
      rmSync(TMP_DIR, { recursive: true, force: true })
    }
  })

  it('detects jpeg MIME type', () => {
    mkdirSync(TMP_DIR, { recursive: true })
    const filePath = join(TMP_DIR, 'photo.jpeg')
    writeFileSync(filePath, Buffer.from('fake-jpeg'))
    try {
      const result = resolveFileArg(filePath)
      if (result.type === 'blob') {
        expect(result.blob.type).toBe('image/jpeg')
      }
    } finally {
      rmSync(TMP_DIR, { recursive: true, force: true })
    }
  })

  it('throws for non-existent file', () => {
    expect(() => resolveFileArg('/no/such/file.png')).toThrow()
  })
})
