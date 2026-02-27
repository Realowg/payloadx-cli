import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { parseDataArg } from '../utils/parse-data.js'
import { classifyFetchError, ConfigError } from '../utils/errors.js'
import { enforceProdGuard } from '../utils/prod-guard.js'
import { JournalWriter } from '../journal/writer.js'
import { shallowDiff } from '../utils/diff.js'

export function registerUpdate(program: Command): void {
  program
    .command('update <collection> <id>')
    .description('Update a document by ID')
    .requiredOption('--data <json>', 'patch data (JSON string or @file.json)')
    .action(async (collection: string, id: string, opts, cmd) => {
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

      const journal = new JournalWriter('update', flags.outDir ?? '.payloadx', apply)

      try {
        const before = (await sdk.findByID({ collection: collection as any, id })) as Record<string, any>

        if (!apply) {
          const diff = shallowDiff(before, { ...before, ...data })
          journal.append({
            op: 'update',
            collection,
            id,
            status: 'dry-run',
            before,
            after: { ...before, ...data },
          })

          const output = {
            ...journal.summary(),
            wouldUpdate: true,
            collection,
            id,
            diff,
          }

          if (flags.json) {
            jsonOut(output)
          } else {
            log.info(`DRY-RUN: Would update "${collection}" doc ${id}`)
            for (const d of diff) {
              log.info(`  ${d.field}: ${JSON.stringify(d.before)} → ${JSON.stringify(d.after)}`)
            }
          }
          return
        }

        const result = await sdk.update({ collection: collection as any, id, data })
        journal.append({
          op: 'update',
          collection,
          id,
          status: 'success',
          before,
          after: result,
        })

        const output = { ...journal.summary(), doc: result }
        if (flags.json) {
          jsonOut(output)
        } else {
          log.info(`Updated document ${id} in "${collection}"`)
        }
      } catch (err) {
        journal.append({
          op: 'update',
          collection,
          id,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
        throw classifyFetchError(err)
      }
    })
}
