import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { parseDataArg } from '../utils/parse-data.js'
import { classifyFetchError, ConfigError } from '../utils/errors.js'
import { enforceProdGuard } from '../utils/prod-guard.js'
import { JournalWriter } from '../journal/writer.js'
import { shallowDiff } from '../utils/diff.js'
import { resolveFileArg } from '../utils/resolve-file.js'

export function registerUpdate(program: Command): void {
  program
    .command('update <collection> <id>')
    .description('Update a document by ID')
    .option('--data <json>', 'patch data (JSON string or @file.json)')
    .option('--file <path>', 'file path or URL for upload collections (e.g. media)')
    .action(async (collection: string, id: string, opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk, config } = buildContext(flags)

      if (!opts.data && !opts.file) {
        throw new ConfigError('--data and/or --file is required')
      }

      const data = opts.data
        ? (parseDataArg(opts.data) as Record<string, any>)
        : {}

      if (typeof data !== 'object' || data === null) {
        throw new ConfigError('--data must be a JSON object')
      }

      const apply = !!flags.apply
      if (apply) {
        enforceProdGuard(config, !!flags.allowProd)
      }

      const journal = new JournalWriter('update', flags.outDir ?? '.payloadx', apply)

      let fileValue: Blob | string | undefined
      if (opts.file) {
        const resolved = resolveFileArg(opts.file)
        fileValue = resolved.type === 'url' ? resolved.url : resolved.blob
      }

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

          const output: Record<string, any> = {
            ...journal.summary(),
            wouldUpdate: true,
            collection,
            id,
            diff,
          }
          if (opts.file) {
            output.file = opts.file
          }

          if (flags.json) {
            jsonOut(output)
          } else {
            log.info(`DRY-RUN: Would update "${collection}" doc ${id}`)
            if (opts.file) log.info(`  File: ${opts.file}`)
            for (const d of diff) {
              log.info(`  ${d.field}: ${JSON.stringify(d.before)} → ${JSON.stringify(d.after)}`)
            }
          }
          return
        }

        const updateOpts: Record<string, any> = { collection, id, data }
        if (fileValue !== undefined) {
          updateOpts.file = fileValue
        }

        const result = await sdk.update(updateOpts as any)
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
