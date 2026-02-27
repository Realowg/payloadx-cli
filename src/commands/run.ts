import type { Command } from 'commander'
import { existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildContext } from '../cli.js'
import { jsonOut, log } from '../utils/output.js'
import { ConfigError, classifyFetchError } from '../utils/errors.js'
import { enforceProdGuard } from '../utils/prod-guard.js'
import { JournalWriter } from '../journal/writer.js'

function resolveScript(script: string): string {
  if (existsSync(script)) return resolve(script)

  const extensions = ['.ts', '.js', '.mjs']
  const dirs = [
    resolve(process.cwd(), 'payloadx', 'scripts'),
    resolve(process.cwd(), '.payloadx', 'scripts'),
  ]

  for (const dir of dirs) {
    for (const ext of extensions) {
      const candidate = resolve(dir, script.endsWith(ext) ? script : `${script}${ext}`)
      if (existsSync(candidate)) return candidate
    }
  }

  throw new ConfigError(`Script not found: ${script}`)
}

export function registerRun(program: Command): void {
  program
    .command('run <script>')
    .description('Run a migration/automation script')
    .allowUnknownOption(true)
    .action(async (script: string, _opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const { sdk, config, auth } = buildContext(flags)

      const apply = !!flags.apply
      if (apply) {
        enforceProdGuard(config, !!flags.allowProd)
      }

      const journal = new JournalWriter('run', flags.outDir ?? '.payloadx', apply)
      const scriptPath = resolveScript(script)
      const ext = extname(scriptPath)

      if (ext === '.ts') {
        log.warn('TypeScript scripts require a Node loader (e.g. tsx). Attempting import...')
      }

      try {
        const mod = await import(pathToFileURL(scriptPath).href)
        const mainFn = mod.default ?? mod.main

        if (typeof mainFn !== 'function') {
          throw new ConfigError(`Script must export a default async function: ${scriptPath}`)
        }

        const result = await mainFn({
          sdk,
          log,
          args: cmd.args.slice(1),
          profile: config.profile,
          dryRun: !apply,
          apply,
          journal,
        })

        const summary = journal.summary()
        const output = { ...summary, scriptResult: result?.summary ?? result ?? null }

        if (flags.json) {
          jsonOut(output)
        } else {
          log.info(`Script "${script}" completed.`)
          if (result?.summary) log.info(JSON.stringify(result.summary, null, 2))
        }
      } catch (err) {
        if (err instanceof ConfigError) throw err
        journal.append({
          op: 'run',
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
        throw classifyFetchError(err)
      }
    })
}
