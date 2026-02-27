export const EXIT_SUCCESS = 0
export const EXIT_VALIDATION = 2
export const EXIT_AUTH = 3
export const EXIT_NETWORK = 4
export const EXIT_SERVER = 5
export const EXIT_PARTIAL = 6

export class PayloadxError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number,
  ) {
    super(message)
    this.name = 'PayloadxError'
  }
}

export class ConfigError extends PayloadxError {
  constructor(message: string) {
    super(message, EXIT_VALIDATION)
    this.name = 'ConfigError'
  }
}

export class AuthError extends PayloadxError {
  constructor(message: string) {
    super(message, EXIT_AUTH)
    this.name = 'AuthError'
  }
}

export class NetworkError extends PayloadxError {
  constructor(message: string) {
    super(message, EXIT_NETWORK)
    this.name = 'NetworkError'
  }
}

export class ServerError extends PayloadxError {
  constructor(message: string) {
    super(message, EXIT_SERVER)
    this.name = 'ServerError'
  }
}

export class PartialFailureError extends PayloadxError {
  constructor(
    message: string,
    public readonly errors: Array<{ id?: string; error: string }> = [],
  ) {
    super(message, EXIT_PARTIAL)
    this.name = 'PartialFailureError'
  }
}

export function classifyHttpError(status: number, body?: string): PayloadxError {
  const msg = body ?? `HTTP ${status}`
  if (status === 401 || status === 403) return new AuthError(msg)
  if (status >= 500) return new ServerError(msg)
  return new PayloadxError(msg, EXIT_VALIDATION)
}

export function classifyFetchError(err: unknown): PayloadxError {
  if (err instanceof PayloadxError) return err
  const message = err instanceof Error ? err.message : String(err)
  if (
    message.includes('fetch failed') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('AbortError') ||
    message.includes('timeout')
  ) {
    return new NetworkError(message)
  }
  return new ServerError(message)
}
