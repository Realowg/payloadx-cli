import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { parseDataArg } from '../utils/parse-data.js'
import { classifyFetchError, ConfigError, PartialFailureError } from '../utils/errors.js'
import { enforceProdGuard } from '../utils/prod-guard.js'
import { JournalWriter } from '../journal/writer.js'

export function registerBulkUpdate(program: Command): void {
  program
    .command('bulk-update <collection>')
    .description('Update multiple documents matching a query')
    .requiredOption('--where <json>', 'where query (JSON string or @file.json)')
    .requiredOption('--set <json>', 'data to set (JSON string or @file.json)')
    .option('--limit <n>', 'safety cap for max docs to update', '200')
    .action(async (collection: string, opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk, config } = buildContext(flags)
      const where = parseDataArg(opts.where) as Record<string, any>
      const setData = parseDataArg(opts.set) as Record<string, any>
      const limit = parseInt(opts.limit, 10)

      if (!where || typeof where !== 'object') {
        throw new ConfigError('--where must be a JSON object')
      }
      if (!setData || typeof setData !== 'object') {
        throw new ConfigError('--set must be a JSON object')
      }

      const apply = !!flags.apply
      if (apply) {
        enforceProdGuard(config, !!flags.allowProd)
      }

      const journal = new JournalWriter('bulk-update', flags.outDir ?? '.payloadx', apply)

      try {
        const found = await sdk.find({
          collection: collection as any,
          where: where as any,
          limit,
        })
        const docs = (found as any).docs as Array<Record<string, any>>
        const totalDocs = (found as any).totalDocs as number

        if (!apply) {
          for (const doc of docs) {
            journal.append({
              op: 'bulk-update',
              collection,
              id: doc.id,
              where,
              status: 'dry-run',
              before: doc,
              after: { ...doc, ...setData },
            })
          }

          const output = {
            ...journal.summary(),
            wouldUpdate: true,
            collection,
            matchedDocs: totalDocs,
            cappedAt: limit,
            sampleIds: docs.slice(0, 5).map((d) => d.id),
          }

          if (flags.json) {
            jsonOut(output)
          } else {
            log.info(`DRY-RUN: Would update ${totalDocs} docs in "${collection}" (capped at ${limit})`)
          }
          return
        }

        for (const doc of docs) {
          try {
            const result = await sdk.update({
              collection: collection as any,
              id: doc.id,
              data: setData,
            })
            journal.append({
              op: 'bulk-update',
              collection,
              id: doc.id,
              status: 'success',
              before: doc,
              after: result,
            })
          } catch (err) {
            journal.append({
              op: 'bulk-update',
              collection,
              id: doc.id,
              status: 'error',
              error: err instanceof Error ? err.message : String(err),
            })
          }
        }

        const summary = journal.summary()
        if (flags.json) {
          jsonOut(summary)
        } else {
          log.info(`Bulk update complete: ${summary.succeeded} succeeded, ${summary.failed} failed`)
        }

        if (summary.failed > 0) {
          throw new PartialFailureError(
            `${summary.failed} of ${summary.touched} updates failed`,
            summary.errors,
          )
        }
      } catch (err) {
        if (err instanceof PartialFailureError) throw err
        throw classifyFetchError(err)
      }
    })
}
