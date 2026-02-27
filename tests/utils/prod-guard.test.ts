import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isProd, enforceProdGuard } from '../../src/utils/prod-guard.js'
import { ConfigError } from '../../src/utils/errors.js'
import type { ResolvedConfig } from '../../src/config/schema.js'

describe('isProd', () => {
  it('returns true for environment=prod', () => {
    expect(isProd({ baseURL: 'https://localhost:3000/api', authCollection: 'users', environment: 'prod' })).toBe(true)
  })

  it('returns true for environment=production', () => {
    expect(isProd({ baseURL: 'https://localhost:3000/api', authCollection: 'users', environment: 'production' })).toBe(true)
  })

  it('returns false for staging URL', () => {
    expect(isProd({ baseURL: 'https://staging.example.com/api', authCollection: 'users' })).toBe(false)
  })

  it('returns false for localhost', () => {
    expect(isProd({ baseURL: 'http://localhost:3000/api', authCollection: 'users' })).toBe(false)
  })

  it('returns true for production-looking URL without non-prod markers', () => {
    expect(isProd({ baseURL: 'https://example.com/api', authCollection: 'users' })).toBe(true)
  })
})

describe('enforceProdGuard', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.PAYLOADX_ALLOW_PROD
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('throws ConfigError for prod without --allow-prod', () => {
    const config: ResolvedConfig = { baseURL: 'https://example.com/api', authCollection: 'users', environment: 'prod' }
    expect(() => enforceProdGuard(config, false)).toThrow(ConfigError)
  })

  it('does not throw with --allow-prod flag', () => {
    const config: ResolvedConfig = { baseURL: 'https://example.com/api', authCollection: 'users', environment: 'prod' }
    expect(() => enforceProdGuard(config, true)).not.toThrow()
  })

  it('does not throw with env PAYLOADX_ALLOW_PROD=1', () => {
    process.env.PAYLOADX_ALLOW_PROD = '1'
    const config: ResolvedConfig = { baseURL: 'https://example.com/api', authCollection: 'users', environment: 'prod' }
    expect(() => enforceProdGuard(config, false)).not.toThrow()
  })

  it('does not throw for non-prod targets', () => {
    const config: ResolvedConfig = { baseURL: 'http://localhost:3000/api', authCollection: 'users' }
    expect(() => enforceProdGuard(config, false)).not.toThrow()
  })
})
