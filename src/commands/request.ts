import type { Command } from 'commander'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { parseDataArg } from '../utils/parse-data.js'
import { classifyFetchError, classifyHttpError } from '../utils/errors.js'
import { enforceProdGuard } from '../utils/prod-guard.js'
import { JournalWriter } from '../journal/writer.js'

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

export function registerRequest(program: Command): void {
  program
    .command('request')
    .description('Make a raw HTTP request to the Payload API')
    .requiredOption('--method <method>', 'HTTP method: GET|POST|PATCH|PUT|DELETE')
    .requiredOption('--path <path>', 'API path (e.g. /custom-endpoint)')
    .option('--data <json>', 'request body (JSON string or @file.json)')
    .action(async (opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk, config } = buildContext(flags)
      const method = opts.method.toUpperCase() as 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
      const isWrite = WRITE_METHODS.has(method)

      const apply = !!flags.apply
      if (isWrite) {
        if (apply) {
          enforceProdGuard(config, !!flags.allowProd)
        }

        if (!apply) {
          const journal = new JournalWriter('request', flags.outDir ?? '.payloadx', false)
          journal.append({
            op: 'request',
            status: 'dry-run',
          })

          const output = {
            ...journal.summary(),
            wouldRequest: true,
            method,
            path: opts.path,
            hasBody: !!opts.data,
          }

          if (flags.json) {
            jsonOut(output)
          } else {
            log.info(`DRY-RUN: Would ${method} ${opts.path}`)
          }
          return
        }
      }

      try {
        const reqOpts: Record<string, any> = { method, path: opts.path }
        if (opts.data) {
          reqOpts.json = parseDataArg(opts.data)
        }

        const res = await sdk.request(reqOpts as any)
        const body = await res.text()

        if (!res.ok) {
          throw classifyHttpError(res.status, body)
        }

        let parsed: unknown
        try {
          parsed = JSON.parse(body)
        } catch {
          parsed = body
        }

        if (isWrite) {
          const journal = new JournalWriter('request', flags.outDir ?? '.payloadx', true)
          journal.append({
            op: 'request',
            status: 'success',
            after: parsed,
          })

          if (flags.json) {
            jsonOut({ ...journal.summary(), response: parsed })
          } else {
            log.info(`${method} ${opts.path} — ${res.status}`)
          }
        } else {
          if (flags.json) {
            jsonOut(parsed)
          } else {
            log.info(`${method} ${opts.path} — ${res.status}`)
            log.info(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2))
          }
        }
      } catch (err) {
        throw classifyFetchError(err)
      }
    })
}
