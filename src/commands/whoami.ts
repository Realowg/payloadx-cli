import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { AuthError, classifyFetchError } from '../utils/errors.js'

export function registerWhoami(program: Command): void {
  program
    .command('whoami')
    .description('Show current authenticated user identity')
    .action(async (_opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk, config, auth } = buildContext(flags)

      if (auth.method === 'none') {
        throw new AuthError('No credentials provided. Set PAYLOADX_API_KEY or PAYLOADX_JWT.')
      }

      try {
        const res = await sdk.me({ collection: config.authCollection as any })

        if (flags.json) {
          jsonOut(res)
        } else {
          const user = (res as any)?.user
          if (user) {
            log.info(`Authenticated as: ${user.email ?? user.id ?? JSON.stringify(user)}`)
          } else {
            log.warn('No user returned from /me endpoint.')
          }
        }
      } catch (err) {
        throw classifyFetchError(err)
      }
    })
}
