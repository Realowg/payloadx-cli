import type { ResolvedConfig } from '../config/schema.js'
import { ConfigError } from './errors.js'

const NON_PROD_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'staging',
  'dev',
  'test',
  'local',
  'preview',
  'sandbox',
]

export function isProd(config: ResolvedConfig): boolean {
  if (config.environment === 'prod' || config.environment === 'production') {
    return true
  }
  const url = config.baseURL.toLowerCase()
  return !NON_PROD_PATTERNS.some((p) => url.includes(p))
}

export function enforceProdGuard(
  config: ResolvedConfig,
  allowProd: boolean,
): void {
  if (!isProd(config)) return

  const envAllow =
    process.env.PAYLOADX_ALLOW_PROD === '1' ||
    process.env.PAYLOADX_ALLOW_PROD === 'true'

  if (!allowProd && !envAllow) {
    throw new ConfigError(
      'Target appears to be production. Add --allow-prod or set PAYLOADX_ALLOW_PROD=1 to proceed.',
    )
  }
}
