import { describe, it, expect } from 'vitest'
import {
  ConfigError,
  AuthError,
  NetworkError,
  ServerError,
  PartialFailureError,
  classifyHttpError,
  classifyFetchError,
  EXIT_VALIDATION,
  EXIT_AUTH,
  EXIT_NETWORK,
  EXIT_SERVER,
  EXIT_PARTIAL,
} from '../../src/utils/errors.js'

describe('error classes', () => {
  it('ConfigError has exit code 2', () => {
    const err = new ConfigError('bad config')
    expect(err.exitCode).toBe(EXIT_VALIDATION)
  })

  it('AuthError has exit code 3', () => {
    const err = new AuthError('no auth')
    expect(err.exitCode).toBe(EXIT_AUTH)
  })

  it('NetworkError has exit code 4', () => {
    const err = new NetworkError('timeout')
    expect(err.exitCode).toBe(EXIT_NETWORK)
  })

  it('ServerError has exit code 5', () => {
    const err = new ServerError('500')
    expect(err.exitCode).toBe(EXIT_SERVER)
  })

  it('PartialFailureError has exit code 6', () => {
    const err = new PartialFailureError('some failed', [{ id: '1', error: 'oops' }])
    expect(err.exitCode).toBe(EXIT_PARTIAL)
    expect(err.errors).toHaveLength(1)
  })
})

describe('classifyHttpError', () => {
  it('401 -> AuthError', () => {
    const err = classifyHttpError(401)
    expect(err.exitCode).toBe(EXIT_AUTH)
  })

  it('403 -> AuthError', () => {
    const err = classifyHttpError(403)
    expect(err.exitCode).toBe(EXIT_AUTH)
  })

  it('500 -> ServerError', () => {
    const err = classifyHttpError(500)
    expect(err.exitCode).toBe(EXIT_SERVER)
  })

  it('400 -> validation error', () => {
    const err = classifyHttpError(400)
    expect(err.exitCode).toBe(EXIT_VALIDATION)
  })
})

describe('classifyFetchError', () => {
  it('ECONNREFUSED -> NetworkError', () => {
    const err = classifyFetchError(new Error('fetch failed: ECONNREFUSED'))
    expect(err.exitCode).toBe(EXIT_NETWORK)
  })

  it('timeout -> NetworkError', () => {
    const err = classifyFetchError(new Error('AbortError: timeout'))
    expect(err.exitCode).toBe(EXIT_NETWORK)
  })

  it('unknown error -> ServerError', () => {
    const err = classifyFetchError(new Error('something weird'))
    expect(err.exitCode).toBe(EXIT_SERVER)
  })

  it('passes through PayloadxError', () => {
    const original = new AuthError('already classified')
    const err = classifyFetchError(original)
    expect(err).toBe(original)
  })
})
