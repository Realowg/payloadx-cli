import { PayloadSDK } from '@payloadcms/sdk'
import type { AuthResult } from '../auth/headers.js'
import { classifyFetchError } from '../utils/errors.js'

export function createSDK(
  baseURL: string,
  auth: AuthResult,
  timeoutMs?: number,
): PayloadSDK {
  const sdk = new PayloadSDK({
    baseURL,
    baseInit: {
      headers: auth.headers,
    },
    fetch: async (url: string | URL | Request, init?: RequestInit) => {
      const controller = new AbortController()
      const timeout = timeoutMs ?? 30_000
      const timer = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await globalThis.fetch(url, {
          ...init,
          signal: controller.signal,
        })
        return response
      } catch (err) {
        throw classifyFetchError(err)
      } finally {
        clearTimeout(timer)
      }
    },
  })

  return sdk
}
