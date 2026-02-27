import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { parseDataArg } from '../utils/parse-data.js'
import { classifyFetchError } from '../utils/errors.js'

export function registerFind(program: Command): void {
  program
    .command('find <collection>')
    .description('Find documents in a collection')
    .option('--where <json>', 'where query (JSON string or @file.json)')
    .option('--limit <n>', 'max documents per page', '10')
    .option('--page <n>', 'page number', '1')
    .option('--depth <n>', 'relationship population depth')
    .option('--sort <field>', 'sort field')
    .option('--locale <code>', 'locale code')
    .option('--draft', 'include draft documents')
    .action(async (collection: string, opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk } = buildContext(flags)

      const findOpts: Record<string, any> = {
        collection,
        limit: parseInt(opts.limit, 10),
        page: parseInt(opts.page, 10),
      }

      if (opts.where) {
        findOpts.where = parseDataArg(opts.where)
      }
      if (opts.depth !== undefined) {
        findOpts.depth = parseInt(opts.depth, 10)
      }
      if (opts.sort) findOpts.sort = opts.sort
      if (opts.locale) findOpts.locale = opts.locale
      if (opts.draft) findOpts.draft = true

      try {
        const result = await sdk.find(findOpts as any)

        const normalized = {
          docs: (result as any).docs,
          meta: {
            totalDocs: (result as any).totalDocs,
            limit: (result as any).limit,
            totalPages: (result as any).totalPages,
            page: (result as any).page,
            pagingCounter: (result as any).pagingCounter,
            hasPrevPage: (result as any).hasPrevPage,
            hasNextPage: (result as any).hasNextPage,
            prevPage: (result as any).prevPage,
            nextPage: (result as any).nextPage,
          },
        }

        if (flags.json) {
          jsonOut(normalized)
        } else {
          log.info(`Found ${normalized.meta.totalDocs} docs (page ${normalized.meta.page}/${normalized.meta.totalPages})`)
          for (const doc of normalized.docs) {
            log.info(`  - ${(doc as any).id}`)
          }
        }
      } catch (err) {
        throw classifyFetchError(err)
      }
    })
}
