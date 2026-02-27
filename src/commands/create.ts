import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { parseDataArg } from '../utils/parse-data.js'
import { classifyFetchError, ConfigError } from '../utils/errors.js'
import { enforceProdGuard } from '../utils/prod-guard.js'
import { JournalWriter } from '../journal/writer.js'

export function registerCreate(program: Command): void {
  program
    .command('create <collection>')
    .description('Create a document in a collection')
    .requiredOption('--data <json>', 'document data (JSON string or @file.json)')
    .action(async (collection: string, opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk, config } = buildContext(flags)
      const data = parseDataArg(opts.data) as Record<string, any>

      if (!data || typeof data !== 'object') {
        throw new ConfigError('--data must be a JSON object')
      }

      const apply = !!flags.apply
      if (apply) {
        enforceProdGuard(config, !!flags.allowProd)
      }

      const journal = new JournalWriter('create', flags.outDir ?? '.payloadx', apply)

      if (!apply) {
        journal.append({
          op: 'create',
          collection,
          status: 'dry-run',
          after: data,
        })

        const output = {
          ...journal.summary(),
          wouldCreate: true,
          collection,
          samplePayload: data,
        }

        if (flags.json) {
          jsonOut(output)
        } else {
          log.info(`DRY-RUN: Would create document in "${collection}"`)
          log.info(`  Payload: ${JSON.stringify(data).slice(0, 200)}`)
        }
        return
      }

      try {
        const result = await sdk.create({ collection: collection as any, data })
        journal.append({
          op: 'create',
          collection,
          id: (result as any)?.id,
          status: 'success',
          after: result,
        })

        const output = { ...journal.summary(), doc: result }
        if (flags.json) {
          jsonOut(output)
        } else {
          log.info(`Created document ${(result as any)?.id} in "${collection}"`)
        }
      } catch (err) {
        journal.append({
          op: 'create',
          collection,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
        throw classifyFetchError(err)
      }
    })
}
