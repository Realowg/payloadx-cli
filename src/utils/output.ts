export function jsonOut(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n')
}

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug'

const LOG_PRIORITY: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
}

let currentLevel: LogLevel = 'info'

export function setLogLevel(level: LogLevel): void {
  currentLevel = level
}

function shouldLog(level: LogLevel): boolean {
  return LOG_PRIORITY[level] <= LOG_PRIORITY[currentLevel]
}

function logToStderr(level: string, msg: string): void {
  process.stderr.write(`[payloadx:${level}] ${msg}\n`)
}

export const log = {
  error(msg: string) {
    if (shouldLog('error')) logToStderr('error', msg)
  },
  warn(msg: string) {
    if (shouldLog('warn')) logToStderr('warn', msg)
  },
  info(msg: string) {
    if (shouldLog('info')) logToStderr('info', msg)
  },
  debug(msg: string) {
    if (shouldLog('debug')) logToStderr('debug', msg)
  },
}
