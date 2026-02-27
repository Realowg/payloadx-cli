export interface FieldDiff {
  field: string
  before: unknown
  after: unknown
}

export function shallowDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): FieldDiff[] {
  const diffs: FieldDiff[] = []
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

  for (const key of allKeys) {
    const bVal = before[key]
    const aVal = after[key]
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      diffs.push({ field: key, before: bVal, after: aVal })
    }
  }

  return diffs
}
