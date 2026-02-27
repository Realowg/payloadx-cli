import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { homedir } from 'node:os'
import type { PayloadxConfig, ResolvedConfig } from './schema.js'
import { DEFAULT_AUTH_COLLECTION } from './schema.js'
import { ConfigError } from '../utils/errors.js'

function loadJsonFile(filePath: string): PayloadxConfig | null {
  if (!existsSync(filePath)) return null
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as PayloadxConfig
  } catch {
    throw new ConfigError(`Failed to parse config file: ${filePath}`)
  }
}

export interface CliFlags {
  profile?: string
  baseUrl?: string
  authCollection?: string
  apiKey?: string
  jwt?: string
  outDir?: string
  allowProd?: boolean
  apply?: boolean
  timeout?: number
  logLevel?: string
  json?: boolean
}

export function resolveConfig(flags: CliFlags): ResolvedConfig {
  const projectPath = resolve(process.cwd(), '.payloadxrc.json')
  const homePath = join(homedir(), '.payloadxrc.json')

  const projectConfig = loadJsonFile(projectPath)
  const homeConfig = loadJsonFile(homePath)

  const merged: PayloadxConfig = {
    profiles: {
      ...(homeConfig?.profiles ?? {}),
      ...(projectConfig?.profiles ?? {}),
    },
    defaults: {
      ...(homeConfig?.defaults ?? {}),
      ...(projectConfig?.defaults ?? {}),
    },
  }

  const profileName =
    flags.profile ??
    process.env.PAYLOADX_PROFILE ??
    merged.defaults?.profile

  const profile = profileName ? merged.profiles[profileName] : undefined

  const baseURL =
    flags.baseUrl ??
    process.env.PAYLOADX_BASE_URL ??
    profile?.baseURL ??
    ''

  const authCollection =
    flags.authCollection ??
    process.env.PAYLOADX_AUTH_COLLECTION ??
    profile?.authCollection ??
    DEFAULT_AUTH_COLLECTION

  const environment = profile?.environment

  return {
    baseURL,
    authCollection,
    environment,
    profile: profileName,
  }
}

export function requireBaseURL(config: ResolvedConfig): void {
  if (!config.baseURL) {
    throw new ConfigError(
      'baseURL is required. Set via --base-url, PAYLOADX_BASE_URL env, or .payloadxrc.json profile.',
    )
  }
}
