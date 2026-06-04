// src/utils/csvImport.js
// Helpers for the CSV import wizard: parsing, row-cap enforcement,
// date-format conversion, amount cleanup, sign handling, and splitting
// normalized rows into expenses vs incomes.

import Papa from 'papaparse'

// Maximum rows we accept in a single import (no chunking).
export const MAX_CSV_ROWS = 150

// Source date formats the user can pick from on the mapping step.
// Each is converted to our canonical YYYY-MM-DD.
export const DATE_FORMATS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-01-31)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/31/2025)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/01/2025)' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY (01-31-2025)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-01-2025)' },
  { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (31-Jan-2025)' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Jan 31, 2025)' },
  { value: 'DD/MM/YY', label: 'DD/MM/YY (31/01/25)' },
  { value: 'MM/DD/YY', label: 'MM/DD/YY (01/31/25)' },
]

// '-' means expense (our standard) vs '-' means credit/income.
export const SIGN_CONVENTIONS = [
  { value: 'standard', label: "Standard: a minus sign ( - ) means an expense" },
  { value: 'flipped', label: "Reversed: a minus sign ( - ) means income/credit" },
]

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

/**
 * Parse a CSV File into { headers, rows }.
 * Uses header row detection; trims/strips BOM from headers; skips blank lines.
 * @param {File} file
 * @returns {Promise<{ headers: string[], rows: Object[] }>}
 */
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => (h || '').replace(/^\uFEFF/, '').trim(),
      complete: (results) => {
        const headers = (results.meta?.fields || []).filter((h) => h && h.length > 0)
        const rows = (results.data || []).filter(
          (r) => r && Object.values(r).some((v) => v != null && String(v).trim() !== '')
        )
        resolve({ headers, rows })
      },
      error: (err) => reject(err),
    })
  })
}

/**
 * Convert a date string from the selected source format to YYYY-MM-DD.
 * Returns null when the value cannot be parsed.
 * @param {string} raw
 * @param {string} format - one of DATE_FORMATS values
 */
export function convertDate(raw, format) {
  if (raw == null) return null
  const value = String(raw).trim()
  if (!value || !format) return null

  const fmtTokens = format.split(/[^A-Za-z]+/).filter(Boolean)
  const valParts = value.split(/[^A-Za-z0-9]+/).filter(Boolean)
  if (fmtTokens.length !== valParts.length) return null

  let year, month, day
  for (let i = 0; i < fmtTokens.length; i++) {
    const token = fmtTokens[i].toUpperCase()
    const part = valParts[i]
    if (token.startsWith('Y')) {
      let y = parseInt(part, 10)
      if (Number.isNaN(y)) return null
      if (token.length <= 2) y += 2000
      year = y
    } else if (token === 'MMM' || token === 'MMMM') {
      month = MONTHS[part.slice(0, 3).toLowerCase()]
    } else if (token.startsWith('M')) {
      month = parseInt(part, 10)
    } else if (token.startsWith('D')) {
      day = parseInt(part, 10)
    }
  }

  if (!year || !month || !day) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/**
 * Parse a raw amount cell into a signed number.
 * Handles currency symbols, thousands separators, accounting negatives "(12.34)",
 * and DR/CR indicators.
 * @returns {{ value: number, explicit: boolean }} value is NaN when unparseable.
 *   `explicit` is true when the sign came from a DR/CR indicator (so the
 *   user's sign-convention flip should not be applied to it).
 */
export function parseAmountCell(raw) {
  if (raw == null) return { value: NaN, explicit: false }
  if (typeof raw === 'number') return { value: raw, explicit: false }

  let s = String(raw).trim()
  if (!s) return { value: NaN, explicit: false }

  let sign = 1
  let explicit = false

  // Accounting parentheses => negative
  if (/^\(.*\)$/.test(s)) {
    sign = -1
    s = s.slice(1, -1)
  }

  // DR / CR indicators (debit = expense/negative, credit = income/positive)
  if (/\bdr\b|dr\.?$/i.test(s)) {
    sign = -1
    explicit = true
  } else if (/\bcr\b|cr\.?$/i.test(s)) {
    sign = 1
    explicit = true
  }

  // Strip everything except digits, dot and minus
  const cleaned = s.replace(/[^0-9.\-]/g, '')
  if (cleaned === '' || cleaned === '-' || cleaned === '.') {
    return { value: NaN, explicit }
  }
  let num = parseFloat(cleaned)
  if (Number.isNaN(num)) return { value: NaN, explicit }

  // Only force the sign when an explicit indicator (parentheses or DR/CR) was found.
  // For plain numbers like "-50" or "50", preserve the sign that parseFloat returned.
  if (sign !== 1 || explicit) {
    num = Math.abs(num) * sign
  }
  return { value: num, explicit }
}

/**
 * Normalize parsed rows into expenses and incomes based on the user's mapping.
 *
 * @param {Object} args
 * @param {Object[]} args.rows - parsed CSV rows (header keyed)
 * @param {Object} args.mapping - { title, amount, date, debit, credit } header keys.
 *   Use either `amount` (single signed column) OR `debit`+`credit` (two columns).
 * @param {string} args.dateFormat - selected source date format
 * @param {string} args.signConvention - 'standard' | 'flipped'
 * @returns {{ expenses: Object[], incomes: Object[], invalid: Object[] }}
 */
export function normalizeRows({ rows, mapping, dateFormat, signConvention }) {
  const expenses = []
  const incomes = []
  const invalid = []
  const usesDebitCredit = !!(mapping.debit || mapping.credit)

  rows.forEach((row, index) => {
    const rawTitle = mapping.title ? row[mapping.title] : ''
    const title = (rawTitle == null ? '' : String(rawTitle)).trim()
    const rawDate = mapping.date ? row[mapping.date] : ''
    const date = convertDate(rawDate, dateFormat)

    const problems = []
    if (!title) problems.push('Missing title')
    if (!date) problems.push(`Unrecognized date "${rawDate ?? ''}"`)

    let kind = null
    let amount = NaN

    if (usesDebitCredit) {
      const debit = mapping.debit ? parseAmountCell(row[mapping.debit]) : { value: NaN }
      const credit = mapping.credit ? parseAmountCell(row[mapping.credit]) : { value: NaN }
      const hasDebit = !Number.isNaN(debit.value) && Math.abs(debit.value) > 0
      const hasCredit = !Number.isNaN(credit.value) && Math.abs(credit.value) > 0
      if (hasDebit) {
        kind = 'expense'
        amount = Math.abs(debit.value)
      } else if (hasCredit) {
        kind = 'income'
        amount = Math.abs(credit.value)
      } else {
        problems.push('No debit/credit amount')
      }
    } else {
      const parsed = parseAmountCell(mapping.amount ? row[mapping.amount] : '')
      if (Number.isNaN(parsed.value) || parsed.value === 0) {
        problems.push(`Invalid amount "${mapping.amount ? row[mapping.amount] ?? '' : ''}"`)
      } else {
        let signed = parsed.value
        // Flip only when the sign was implicit (a plain minus), not from DR/CR.
        if (signConvention === 'flipped' && !parsed.explicit) signed = -signed
        kind = signed < 0 ? 'expense' : 'income'
        amount = Math.abs(signed)
      }
    }

    if (problems.length > 0) {
      invalid.push({ rowIndex: index, title: title || rawTitle || '(untitled)', reason: problems.join('; '), raw: row })
      return
    }

    const entry = {
      title,
      date,
      amount: Number(amount.toFixed(2)),
      kind,
      _rowIndex: index,
    }
    if (kind === 'expense') expenses.push(entry)
    else incomes.push(entry)
  })

  return { expenses, incomes, invalid }
}

/**
 * Net change a set of selected entries will apply to the wallet balance.
 * Expenses reduce the balance; incomes increase it.
 */
export function computeNetDelta(expenses, incomes) {
  const expenseTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const incomeTotal = incomes.reduce((s, e) => s + (e.amount || 0), 0)
  return Number((incomeTotal - expenseTotal).toFixed(2))
}
