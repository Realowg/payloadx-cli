import { describe, it, expect } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { parseDataArg } from '../../src/utils/parse-data.js'
import { ConfigError } from '../../src/utils/errors.js'

const TMP_DIR = join(process.cwd(), '.test-tmp')

describe('parseDataArg', () => {
  it('parses inline JSON string', () => {
    const result = parseDataArg('{"title":"hello"}')
    expect(result).toEqual({ title: 'hello' })
  })

  it('throws ConfigError for invalid JSON', () => {
    expect(() => parseDataArg('not json')).toThrow(ConfigError)
  })

  it('reads and parses @file reference', () => {
    mkdirSync(TMP_DIR, { recursive: true })
    const filePath = join(TMP_DIR, 'test-data.json')
    writeFileSync(filePath, '{"key":"value"}')
    try {
      const result = parseDataArg(`@${filePath}`)
      expect(result).toEqual({ key: 'value' })
    } finally {
      rmSync(TMP_DIR, { recursive: true, force: true })
    }
  })

  it('throws ConfigError for missing @file', () => {
    expect(() => parseDataArg('@nonexistent.json')).toThrow(ConfigError)
  })
})
