import { Command } from 'commander'
import { resolveConfig, requireBaseURL, type CliFlags } from './config/loader.js'
import { buildAuthHeaders } from './auth/headers.js'
import { createSDK } from './sdk/client.js'
import { setLogLevel, log, jsonOut, type LogLevel } from './utils/output.js'
import { PayloadxError, EXIT_VALIDATION } from './utils/errors.js'

import { registerInit } from './commands/init.js'
import { registerPing } from './commands/ping.js'
import { registerWhoami } from './commands/whoami.js'
import { registerFind } from './commands/find.js'
import { registerGet } from './commands/get.js'
import { registerCreate } from './commands/create.js'
import { registerUpdate } from './commands/update.js'
import { registerDelete } from './commands/delete.js'
import { registerBulkUpdate } from './commands/bulk-update.js'
import { registerUpsert } from './commands/upsert.js'
import { registerRequest } from './commands/request.js'
import { registerRun } from './commands/run.js'

export interface CommandContext {
  flags: CliFlags
  config: ReturnType<typeof resolveConfig>
  sdk: ReturnType<typeof createSDK>
  auth: ReturnType<typeof buildAuthHeaders>
}

export function buildContext(flags: CliFlags): CommandContext {
  const config = resolveConfig(flags)
  requireBaseURL(config)
  const auth = buildAuthHeaders(config, flags)
  const sdk = createSDK(config.baseURL, auth, flags.timeout)
  return { flags, config, sdk, auth }
}

const program = new Command()

program
  .name('payloadx')
  .description('CLI for Payload CMS — non-interactive REST API client')
  .version('1.0.0')
  .option('--profile <name>', 'config profile name')
  .option('--base-url <url>', 'Payload API base URL')
  .option('--auth-collection <slug>', 'auth collection slug (default: users)')
  .option('--api-key <key>', 'API key (prefer PAYLOADX_API_KEY env)')
  .option('--jwt <token>', 'JWT token (prefer PAYLOADX_JWT env)')
  .option('--json', 'output JSON to stdout')
  .option('--log-level <level>', 'silent|error|warn|info|debug', 'info')
  .option('--out-dir <path>', 'journal output directory', '.payloadx')
  .option('--allow-prod', 'allow writes to production targets')
  .option('--apply', 'execute writes (default is dry-run)')
  .option('--timeout <ms>', 'request timeout in ms', '30000')

program.hook('preAction', (_thisCommand, actionCommand) => {
  const opts = actionCommand.optsWithGlobals()
  setLogLevel((opts.logLevel ?? 'info') as LogLevel)
  if (opts.timeout) {
    opts.timeout = parseInt(opts.timeout, 10)
  }
})

registerInit(program)
registerPing(program)
registerWhoami(program)
registerFind(program)
registerGet(program)
registerCreate(program)
registerUpdate(program)
registerDelete(program)
registerBulkUpdate(program)
registerUpsert(program)
registerRequest(program)
registerRun(program)

program.parseAsync(process.argv).catch((err) => {
  const isJson = process.argv.includes('--json')

  if (err instanceof PayloadxError) {
    if (isJson) {
      jsonOut({ error: err.message, exitCode: err.exitCode })
    } else {
      log.error(err.message)
    }
    process.exit(err.exitCode)
  }

  if (isJson) {
    jsonOut({ error: String(err), exitCode: EXIT_VALIDATION })
  } else {
    log.error(String(err))
  }
  process.exit(EXIT_VALIDATION)
})
