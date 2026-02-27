import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { classifyFetchError } from '../utils/errors.js'
import { enforceProdGuard } from '../utils/prod-guard.js'
import { JournalWriter } from '../journal/writer.js'

export function registerDelete(program: Command): void {
  program
    .command('delete <collection> <id>')
    .description('Delete a document by ID')
    .action(async (collection: string, id: string, _opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk, config } = buildContext(flags)

      const apply = !!flags.apply
      if (apply) {
        enforceProdGuard(config, !!flags.allowProd)
      }

      const journal = new JournalWriter('delete', flags.outDir ?? '.payloadx', apply)

      try {
        const existing = (await sdk.findByID({ collection: collection as any, id })) as Record<string, any>

        if (!apply) {
          journal.append({
            op: 'delete',
            collection,
            id,
            status: 'dry-run',
            before: existing,
          })

          const output = {
            ...journal.summary(),
            wouldDelete: true,
            collection,
            id,
            exists: true,
          }

          if (flags.json) {
            jsonOut(output)
          } else {
            log.info(`DRY-RUN: Would delete "${collection}" doc ${id}`)
          }
          return
        }

        const result = await sdk.delete({ collection: collection as any, id })
        journal.append({
          op: 'delete',
          collection,
          id,
          status: 'success',
          before: existing,
        })

        const output = { ...journal.summary(), doc: result }
        if (flags.json) {
          jsonOut(output)
        } else {
          log.info(`Deleted document ${id} from "${collection}"`)
        }
      } catch (err) {
        journal.append({
          op: 'delete',
          collection,
          id,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
        throw classifyFetchError(err)
      }
    })
}
