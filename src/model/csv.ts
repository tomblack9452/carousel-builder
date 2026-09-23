import type { SlideType } from '../types'
import { SLIDE_TYPES } from './slideTypes'

export interface TextRow {
  type?: SlideType
  title: string
  body: string
}

/** Tab when pasted from a spreadsheet, else whichever of comma or semicolon the first line uses more. */
function detectDelimiter(text: string): string {
  const first = text.split('\n', 1)[0]
  if (first.includes('\t')) return '\t'
  return (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ';' : ','
}

/** RFC 4180-style parsing: quoted fields may contain delimiters, newlines and "" escapes. */
export function parseTable(text: string): string[][] {
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const src = text.replace(/\r\n?/g, '\n')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"' && field === '') quoted = true
    else if (ch === delimiter) { row.push(field); field = '' }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += ch
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows.map((r) => r.map((f) => f.trim())).filter((r) => r.some(Boolean))
}

const TYPE_BY_NAME: Record<string, SlideType> = Object.fromEntries(
  (Object.keys(SLIDE_TYPES) as SlideType[]).flatMap((t) => [[t, t], [SLIDE_TYPES[t].label.toLowerCase(), t]]),
)

function toType(value: string | undefined): SlideType | undefined {
  return value ? TYPE_BY_NAME[value.toLowerCase()] : undefined
}

const HEADER_NAMES = {
  type: ['type', 'slide type', 'layout'],
  title: ['title', 'heading', 'headline', 'quote'],
  body: ['body', 'subtitle', 'caption', 'text', 'description', 'items', 'attribution'],
}

/**
 * Turn table rows into slide text. Uses a header row when there is one;
 * otherwise treats a first column of slide type names as types, then title, then body.
 */
export function rowsToText(table: string[][]): TextRow[] {
  if (!table.length) return []
  const header = table[0].map((h) => h.toLowerCase())
  const col = (names: string[]) => header.findIndex((h) => names.includes(h))
  const hasHeader = col(HEADER_NAMES.title) >= 0 || col(HEADER_NAMES.body) >= 0

  let typeCol = -1
  let titleCol = 0
  let bodyCol = 1
  let rows = table
  if (hasHeader) {
    typeCol = col(HEADER_NAMES.type)
    titleCol = col(HEADER_NAMES.title)
    bodyCol = col(HEADER_NAMES.body)
    rows = table.slice(1)
  } else if (table.every((r) => r.length > 1 && toType(r[0]))) {
    typeCol = 0
    titleCol = 1
    bodyCol = 2
  }

  return rows.map((r) => ({
    type: typeCol >= 0 ? toType(r[typeCol]) : undefined,
    title: titleCol >= 0 ? (r[titleCol] ?? '') : '',
    // Cells can't hold real line breaks when pasted, so allow " | " for list items and labels.
    body: bodyCol >= 0 ? (r[bodyCol] ?? '').replace(/\s*\|\s*/g, '\n') : '',
  }))
}
