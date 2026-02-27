export interface ProfileConfig {
  baseURL: string
  authCollection?: string
  environment?: 'development' | 'staging' | 'prod' | string
}

export interface PayloadxConfig {
  defaults?: {
    profile?: string
  }
  profiles: Record<string, ProfileConfig>
}

export interface ResolvedConfig {
  baseURL: string
  authCollection: string
  environment?: string
  profile?: string
}

export const DEFAULT_AUTH_COLLECTION = 'users'

export function validateConfig(config: Partial<ResolvedConfig>): config is ResolvedConfig {
  return typeof config.baseURL === 'string' && config.baseURL.length > 0
}
