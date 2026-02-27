import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { parseDataArg } from '../utils/parse-data.js'
import { classifyFetchError, ConfigError } from '../utils/errors.js'
import { enforceProdGuard } from '../utils/prod-guard.js'
import { JournalWriter } from '../journal/writer.js'
import { resolveFileArg } from '../utils/resolve-file.js'

export function registerCreate(program: Command): void {
  program
    .command('create <collection>')
    .description('Create a document in a collection')
    .option('--data <json>', 'document data (JSON string or @file.json)')
    .option('--file <path>', 'file path or URL for upload collections (e.g. media)')
    .action(async (collection: string, opts, cmd) => {
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

      const journal = new JournalWriter('create', flags.outDir ?? '.payloadx', apply)

      let fileValue: Blob | string | undefined
      if (opts.file) {
        const resolved = resolveFileArg(opts.file)
        fileValue = resolved.type === 'url' ? resolved.url : resolved.blob
      }

      if (!apply) {
        journal.append({
          op: 'create',
          collection,
          status: 'dry-run',
          after: data,
        })

        const output: Record<string, any> = {
          ...journal.summary(),
          wouldCreate: true,
          collection,
          samplePayload: data,
        }
        if (opts.file) {
          output.file = opts.file
        }

        if (flags.json) {
          jsonOut(output)
        } else {
          log.info(`DRY-RUN: Would create document in "${collection}"`)
          if (opts.file) log.info(`  File: ${opts.file}`)
          log.info(`  Payload: ${JSON.stringify(data).slice(0, 200)}`)
        }
        return
      }

      try {
        const createOpts: Record<string, any> = { collection, data }
        if (fileValue !== undefined) {
          createOpts.file = fileValue
        }

        const result = await sdk.create(createOpts as any)
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
