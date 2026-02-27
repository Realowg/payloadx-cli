import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { parseDataArg } from '../utils/parse-data.js'
import { classifyFetchError, ConfigError } from '../utils/errors.js'
import { enforceProdGuard } from '../utils/prod-guard.js'
import { JournalWriter } from '../journal/writer.js'

export function registerUpsert(program: Command): void {
  program
    .command('upsert <collection>')
    .description('Create or update a document based on a where query')
    .requiredOption('--where <json>', 'where query to find existing doc (JSON string or @file.json)')
    .requiredOption('--data <json>', 'document data (JSON string or @file.json)')
    .action(async (collection: string, opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk, config } = buildContext(flags)
      const where = parseDataArg(opts.where) as Record<string, any>
      const data = parseDataArg(opts.data) as Record<string, any>

      if (!where || typeof where !== 'object') {
        throw new ConfigError('--where must be a JSON object')
      }
      if (!data || typeof data !== 'object') {
        throw new ConfigError('--data must be a JSON object')
      }

      const apply = !!flags.apply
      if (apply) {
        enforceProdGuard(config, !!flags.allowProd)
      }

      const journal = new JournalWriter('upsert', flags.outDir ?? '.payloadx', apply)

      try {
        const found = await sdk.find({
          collection: collection as any,
          where: where as any,
          limit: 1,
        })
        const existing = ((found as any).docs as any[])?.[0]
        const action = existing ? 'update' : 'create'

        if (!apply) {
          journal.append({
            op: 'upsert',
            collection,
            id: existing?.id,
            where,
            status: 'dry-run',
            before: existing ?? null,
            after: data,
          })

          const output = {
            ...journal.summary(),
            action,
            collection,
            existingId: existing?.id ?? null,
          }

          if (flags.json) {
            jsonOut(output)
          } else {
            log.info(`DRY-RUN: Would ${action} in "${collection}"${existing ? ` (doc ${existing.id})` : ''}`)
          }
          return
        }

        let result: any
        if (existing) {
          result = await sdk.update({
            collection: collection as any,
            id: existing.id,
            data,
          })
          journal.append({
            op: 'upsert',
            collection,
            id: existing.id,
            status: 'success',
            before: existing,
            after: result,
          })
        } else {
          result = await sdk.create({
            collection: collection as any,
            data,
          })
          journal.append({
            op: 'upsert',
            collection,
            id: result?.id,
            status: 'success',
            after: result,
          })
        }

        const output = { ...journal.summary(), action, doc: result }
        if (flags.json) {
          jsonOut(output)
        } else {
          log.info(`${action === 'create' ? 'Created' : 'Updated'} document ${result?.id} in "${collection}"`)
        }
      } catch (err) {
        journal.append({
          op: 'upsert',
          collection,
          where,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
        throw classifyFetchError(err)
      }
    })
}
