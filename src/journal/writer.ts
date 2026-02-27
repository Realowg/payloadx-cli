import { mkdirSync, appendFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { randomUUID } from 'node:crypto'

export interface JournalEntry {
  ts: string
  runId: string
  op: string
  collection?: string
  id?: string
  where?: unknown
  status: 'success' | 'error' | 'dry-run'
  before?: unknown
  after?: unknown
  error?: string
}

export interface JournalSummary {
  runId: string
  mode: 'dry-run' | 'apply'
  touched: number
  succeeded: number
  failed: number
  errors: Array<{ id?: string; error: string }>
  journalPath: string
}

export class JournalWriter {
  public readonly runId: string
  public readonly filePath: string
  private touched = 0
  private succeeded = 0
  private failed = 0
  private errors: Array<{ id?: string; error: string }> = []
  private mode: 'dry-run' | 'apply'

  constructor(cmd: string, outDir: string, apply: boolean) {
    this.runId = randomUUID().split('-')[0]
    this.mode = apply ? 'apply' : 'dry-run'
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${ts}_${cmd}_${this.runId}.jsonl`
    this.filePath = join(outDir, 'runs', filename)
    mkdirSync(dirname(this.filePath), { recursive: true })
  }

  append(entry: Omit<JournalEntry, 'ts' | 'runId'>): void {
    const line: JournalEntry = {
      ts: new Date().toISOString(),
      runId: this.runId,
      ...entry,
    }
    appendFileSync(this.filePath, JSON.stringify(line) + '\n')
    this.touched++
    if (entry.status === 'success') {
      this.succeeded++
    } else if (entry.status === 'error') {
      this.failed++
      this.errors.push({ id: entry.id, error: entry.error ?? 'unknown' })
    }
  }

  summary(): JournalSummary {
    return {
      runId: this.runId,
      mode: this.mode,
      touched: this.touched,
      succeeded: this.succeeded,
      failed: this.failed,
      errors: this.errors,
      journalPath: this.filePath,
    }
  }
}
