import type { CliFlags } from '../config/loader.js'
import type { ResolvedConfig } from '../config/schema.js'

export interface AuthResult {
  headers: Record<string, string>
  method: 'api-key' | 'jwt' | 'none'
}

export function buildAuthHeaders(
  config: ResolvedConfig,
  flags: CliFlags,
): AuthResult {
  const apiKey = flags.apiKey ?? process.env.PAYLOADX_API_KEY
  const jwt = flags.jwt ?? process.env.PAYLOADX_JWT

  if (apiKey) {
    return {
      headers: {
        Authorization: `${config.authCollection} API-Key ${apiKey}`,
      },
      method: 'api-key',
    }
  }

  if (jwt) {
    return {
      headers: {
        Authorization: `JWT ${jwt}`,
      },
      method: 'jwt',
    }
  }

  return { headers: {}, method: 'none' }
}
