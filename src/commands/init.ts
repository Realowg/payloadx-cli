import type { Command } from 'commander'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { jsonOut, log } from '../utils/output.js'
import { ConfigError } from '../utils/errors.js'

const TEMPLATE = {
  defaults: { profile: 'staging' },
  profiles: {
    staging: {
      baseURL: 'https://staging.example.com/api',
      authCollection: 'users',
      environment: 'staging',
    },
    prod: {
      baseURL: 'https://example.com/api',
      authCollection: 'users',
      environment: 'prod',
    },
  },
}

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Create a .payloadxrc.json template in the current directory')
    .action(async (_opts, cmd) => {
      const flags = cmd.optsWithGlobals()
      const filePath = resolve(process.cwd(), '.payloadxrc.json')

      if (existsSync(filePath)) {
        throw new ConfigError(`.payloadxrc.json already exists at ${filePath}`)
      }

      writeFileSync(filePath, JSON.stringify(TEMPLATE, null, 2) + '\n')

      if (flags.json) {
        jsonOut({ created: filePath })
      } else {
        log.info(`Created ${filePath}`)
      }
    })
}
