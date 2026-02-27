import { readFileSync } from 'node:fs'
import { ConfigError } from './errors.js'

export function parseDataArg(input: string): unknown {
  if (input.startsWith('@')) {
    const filePath = input.slice(1)
    try {
      const raw = readFileSync(filePath, 'utf-8')
      return JSON.parse(raw)
    } catch (err) {
      throw new ConfigError(
        `Failed to read/parse file "${filePath}": ${err instanceof Error ? err.message : err}`,
      )
    }
  }

  try {
    return JSON.parse(input)
  } catch {
    throw new ConfigError(`Invalid JSON: ${input.slice(0, 100)}`)
  }
}
