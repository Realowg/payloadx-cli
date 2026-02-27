import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { classifyFetchError } from '../utils/errors.js'

export function registerGet(program: Command): void {
  program
    .command('get <collection> <id>')
    .description('Get a single document by ID')
    .option('--depth <n>', 'relationship population depth')
    .option('--locale <code>', 'locale code')
    .option('--draft', 'include draft version')
    .action(async (collection: string, id: string, opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk } = buildContext(flags)

      const findOpts: Record<string, any> = { collection, id }

      if (opts.depth !== undefined) findOpts.depth = parseInt(opts.depth, 10)
      if (opts.locale) findOpts.locale = opts.locale
      if (opts.draft) findOpts.draft = true

      try {
        const result = await sdk.findByID(findOpts as any)

        if (flags.json) {
          jsonOut(result)
        } else {
          log.info(`Document ${id}:`)
          log.info(JSON.stringify(result, null, 2))
        }
      } catch (err) {
        throw classifyFetchError(err)
      }
    })
}
