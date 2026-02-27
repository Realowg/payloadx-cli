import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { classifyFetchError } from '../utils/errors.js'

export function registerPing(program: Command): void {
  program
    .command('ping')
    .description('Verify connectivity to the Payload API')
    .action(async (_opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk, config } = buildContext(flags)

      const start = Date.now()
      try {
        const collection = config.authCollection || 'users'
        const res = await sdk.request({ method: 'GET', path: `/${collection}/me` })
        const elapsed = Date.now() - start
        const status = res.status

        if (flags.json) {
          jsonOut({
            ok: status >= 200 && status < 500,
            status,
            baseURL: config.baseURL,
            elapsedMs: elapsed,
          })
        } else {
          log.info(`Ping OK — ${status} in ${elapsed}ms (${config.baseURL})`)
        }
      } catch (err) {
        throw classifyFetchError(err)
      }
    })
}
