import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildAuthHeaders } from '../../src/auth/headers.js'
import type { ResolvedConfig } from '../../src/config/schema.js'

const baseConfig: ResolvedConfig = {
  baseURL: 'https://example.com/api',
  authCollection: 'users',
}

describe('buildAuthHeaders', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.PAYLOADX_API_KEY
    delete process.env.PAYLOADX_JWT
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('builds API key header with correct format: "<slug> API-Key <key>"', () => {
    const result = buildAuthHeaders(baseConfig, { apiKey: 'my-secret-key' })
    expect(result.method).toBe('api-key')
    expect(result.headers.Authorization).toBe('users API-Key my-secret-key')
  })

  it('uses custom authCollection slug in API key header', () => {
    const config = { ...baseConfig, authCollection: 'third-party-access' }
    const result = buildAuthHeaders(config, { apiKey: 'abc123' })
    expect(result.headers.Authorization).toBe('third-party-access API-Key abc123')
  })

  it('builds JWT header with correct format: "JWT <token>"', () => {
    const result = buildAuthHeaders(baseConfig, { jwt: 'eyJhbGciOiJIUzI1NiIs' })
    expect(result.method).toBe('jwt')
    expect(result.headers.Authorization).toBe('JWT eyJhbGciOiJIUzI1NiIs')
  })

  it('prefers API key over JWT when both provided', () => {
    const result = buildAuthHeaders(baseConfig, {
      apiKey: 'the-key',
      jwt: 'the-token',
    })
    expect(result.method).toBe('api-key')
    expect(result.headers.Authorization).toBe('users API-Key the-key')
  })

  it('reads API key from env var', () => {
    process.env.PAYLOADX_API_KEY = 'env-key'
    const result = buildAuthHeaders(baseConfig, {})
    expect(result.method).toBe('api-key')
    expect(result.headers.Authorization).toBe('users API-Key env-key')
  })

  it('reads JWT from env var', () => {
    process.env.PAYLOADX_JWT = 'env-token'
    const result = buildAuthHeaders(baseConfig, {})
    expect(result.method).toBe('jwt')
    expect(result.headers.Authorization).toBe('JWT env-token')
  })

  it('flag overrides env var for API key', () => {
    process.env.PAYLOADX_API_KEY = 'env-key'
    const result = buildAuthHeaders(baseConfig, { apiKey: 'flag-key' })
    expect(result.headers.Authorization).toBe('users API-Key flag-key')
  })

  it('returns no auth when nothing provided', () => {
    const result = buildAuthHeaders(baseConfig, {})
    expect(result.method).toBe('none')
    expect(result.headers).toEqual({})
  })
})
