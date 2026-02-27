import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resolveConfig } from '../../src/config/loader.js'

describe('resolveConfig', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.PAYLOADX_PROFILE
    delete process.env.PAYLOADX_BASE_URL
    delete process.env.PAYLOADX_AUTH_COLLECTION
    delete process.env.PAYLOADX_API_KEY
    delete process.env.PAYLOADX_JWT
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('CLI flags take highest precedence', () => {
    process.env.PAYLOADX_BASE_URL = 'https://env.example.com/api'
    const result = resolveConfig({ baseUrl: 'https://flag.example.com/api' })
    expect(result.baseURL).toBe('https://flag.example.com/api')
  })

  it('env vars override config file defaults', () => {
    process.env.PAYLOADX_BASE_URL = 'https://env.example.com/api'
    const result = resolveConfig({})
    expect(result.baseURL).toBe('https://env.example.com/api')
  })

  it('uses default authCollection when none provided', () => {
    const result = resolveConfig({ baseUrl: 'https://example.com/api' })
    expect(result.authCollection).toBe('users')
  })

  it('env overrides default authCollection', () => {
    process.env.PAYLOADX_AUTH_COLLECTION = 'admins'
    const result = resolveConfig({ baseUrl: 'https://example.com/api' })
    expect(result.authCollection).toBe('admins')
  })

  it('flag overrides env authCollection', () => {
    process.env.PAYLOADX_AUTH_COLLECTION = 'admins'
    const result = resolveConfig({
      baseUrl: 'https://example.com/api',
      authCollection: 'api-users',
    })
    expect(result.authCollection).toBe('api-users')
  })

  it('returns empty baseURL when nothing provided', () => {
    const result = resolveConfig({})
    expect(result.baseURL).toBe('')
  })
})
