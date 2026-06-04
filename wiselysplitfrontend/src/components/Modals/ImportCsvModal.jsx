// src/components/Modals/ImportCsvModal.jsx
// Multi-step wizard to import personal expenses & incomes from a CSV file.
// Steps: 1) Wallet  2) Map fields  3) Review  4) Result
// Categories are intentionally NOT mapped here: the backend classifier assigns
// expense categories, and income categories are left empty.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { XMarkIcon, InformationCircleIcon, CheckIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid'
import api from '../../api'
import { normalizeExpenseForAPI } from '../../utils/expenseModel'
import {
  parseCsvFile,
  normalizeRows,
  computeNetDelta,
  DATE_FORMATS,
  SIGN_CONVENTIONS,
  MAX_CSV_ROWS,
} from '../../utils/csvImport'
import AddWallet from './AddWallet'

const STEPS = ['Wallet', 'Map fields', 'Review', 'Result']

const selectClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 pr-9 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 cursor-pointer'

function StepBar({ current }) {
  return (
    <ol className="flex items-center w-full mb-6" aria-label="Import progress">
      {STEPS.map((label, idx) => {
        const done = idx < current
        const active = idx === current
        return (
          <li key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2 transition-colors ${
                  done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-400'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <CheckIcon className="w-4 h-4" aria-hidden="true" /> : idx + 1}
              </span>
              <span className={`mt-1 text-xs whitespace-nowrap ${active ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default function ImportCsvModal({
  isOpen,
  onClose,
  wallets = [],
  userId,
  defaultWalletId = null,
  createWallet,
  onImported,
}) {
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(0)

  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [parseError, setParseError] = useState('')

  const [walletId, setWalletId] = useState(defaultWalletId ?? null)
  const [showAddWallet, setShowAddWallet] = useState(false)

  const [amountMode, setAmountMode] = useState('single') // 'single' | 'split'
  const [mapping, setMapping] = useState({ title: '', amount: '', date: '', debit: '', credit: '' })
  const [dateFormat, setDateFormat] = useState(DATE_FORMATS[0].value)
  const [signConvention, setSignConvention] = useState('standard')

  const [excluded, setExcluded] = useState(() => new Set())
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState('')

  const resetAll = () => {
    setStep(0)
    setFileName('')
    setHeaders([])
    setRows([])
    setParseError('')
    setWalletId(defaultWalletId ?? null)
    setAmountMode('single')
    setMapping({ title: '', amount: '', date: '', debit: '', credit: '' })
    setDateFormat(DATE_FORMATS[0].value)
    setSignConvention('standard')
    setExcluded(new Set())
    setSubmitting(false)
    setResult(null)
    setSubmitError('')
  }

  useEffect(() => {
    if (isOpen) {
      resetAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) handleClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, submitting])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    try {
      const { headers: hdrs, rows: parsed } = await parseCsvFile(file)
      if (!hdrs.length) {
        setParseError('Could not detect any columns. Make sure the file has a header row.')
        return
      }
      if (parsed.length === 0) {
        setParseError('No data rows found in the file.')
        return
      }
      if (parsed.length > MAX_CSV_ROWS) {
        setParseError(`This file has ${parsed.length} rows. Please import ${MAX_CSV_ROWS} rows or fewer.`)
        return
      }
      setHeaders(hdrs)
      setRows(parsed)
      setFileName(file.name)
      // Best-effort auto-mapping by common header names
      const lower = (h) => h.toLowerCase()
      const find = (...keys) => hdrs.find((h) => keys.some((k) => lower(h).includes(k))) || ''
      setMapping((m) => ({
        ...m,
        title: find('description', 'title', 'detail', 'memo', 'name', 'transaction'),
        amount: find('amount', 'value'),
        date: find('date'),
        debit: find('debit', 'withdrawal'),
        credit: find('credit', 'deposit'),
      }))
    } catch (err) {
      console.error('CSV parse error', err)
      setParseError('Failed to read the file. Please check that it is a valid CSV.')
    } finally {
      // allow re-selecting the same file
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const normalized = useMemo(() => {
    if (!rows.length) return { expenses: [], incomes: [], invalid: [] }
    const map = amountMode === 'split'
      ? { title: mapping.title, date: mapping.date, debit: mapping.debit, credit: mapping.credit }
      : { title: mapping.title, date: mapping.date, amount: mapping.amount }
    return normalizeRows({ rows, mapping: map, dateFormat, signConvention })
  }, [rows, mapping, amountMode, dateFormat, signConvention])

  const keyOf = (entry) => `${entry.kind}:${entry._rowIndex}`
  const isIncluded = (entry) => !excluded.has(keyOf(entry))
  const toggleEntry = (entry) => {
    setExcluded((prev) => {
      const next = new Set(prev)
      const k = keyOf(entry)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  const selectedExpenses = normalized.expenses.filter(isIncluded)
  const selectedIncomes = normalized.incomes.filter(isIncluded)
  const netDelta = computeNetDelta(selectedExpenses, selectedIncomes)

  const mappingValid = amountMode === 'split'
    ? !!(mapping.title && mapping.date && (mapping.debit || mapping.credit))
    : !!(mapping.title && mapping.date && mapping.amount)

  const handleAddWalletSubmit = async (data) => {
    if (!createWallet) return
    try {
      const list = await createWallet(data)
      if (Array.isArray(list) && list.length) {
        const newest = list[list.length - 1]
        const id = newest.walletId ?? newest.id
        if (id != null) setWalletId(id)
      }
    } catch (err) {
      console.error('Failed to create wallet from import', err)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const expensePayload = selectedExpenses.map((e) =>
        normalizeExpenseForAPI(
          { userId, walletId, entryKind: 'expense', title: e.title, amount: e.amount, date: e.date, category: '' },
          userId,
          false,
          'personal'
        )
      )
      const incomePayload = selectedIncomes.map((e) => ({
        title: e.title,
        amount: e.amount,
        date: e.date,
        category: '',
        userId,
        walletId,
      }))

      let expenseResult = { inserted: 0, skipped: [] }
      let incomeResult = { inserted: 0, skipped: [] }

      if (expensePayload.length > 0) {
        const res = await api.post('/expenses/personal/batch', expensePayload)
        expenseResult = res.data || expenseResult
      }
      if (incomePayload.length > 0) {
        const res = await api.post('/income/batch', incomePayload)
        incomeResult = res.data || incomeResult
      }

      setResult({
        expenseInserted: expenseResult.inserted ?? 0,
        incomeInserted: incomeResult.inserted ?? 0,
        skipped: [...(expenseResult.skipped || []), ...(incomeResult.skipped || [])],
      })
      setStep(3)
      if (onImported) onImported()
    } catch (err) {
      console.error('CSV import failed', err)
      setSubmitError(err.response?.data?.error || 'Import failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const currentWalletName = (() => {
    const w = wallets.find((x) => (x.walletId ?? x.id) === walletId)
    return w ? (w.walletName ?? w.name ?? `Wallet ${walletId}`) : ''
  })()

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4"
      onClick={handleClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-csv-title"
        className="bg-gray-100 dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl shadow-black relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="import-csv-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Import from CSV
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            aria-label="Close import"
          >
            <XMarkIcon className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <StepBar current={step} />

        {/* STEP 1: Wallet */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">
                Import into wallet
              </label>
              {wallets.length > 0 ? (
                <select
                  className={selectClass}
                  value={walletId == null ? '' : walletId}
                  onChange={(e) => setWalletId(e.target.value === '' ? null : Number(e.target.value))}
                >
                  <option value="">Choose a wallet...</option>
                  {wallets.map((w) => {
                    const id = w.walletId ?? w.id
                    const name = w.walletName ?? w.name ?? `Wallet ${id}`
                    return (
                      <option key={id} value={id}>{name}</option>
                    )
                  })}
                </select>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You don&apos;t have any wallets yet. Create one to continue.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAddWallet(true)}
              className="self-start text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              + Add Wallet / Card
            </button>

            <div>
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">
                CSV file
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
              />
              {fileName && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Loaded <span className="font-medium">{fileName}</span> — {rows.length} row{rows.length === 1 ? '' : 's'} detected.
                </p>
              )}
              {parseError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{parseError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={handleClose}
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-5 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!walletId || rows.length === 0}
                onClick={() => setStep(1)}
                className="bg-emerald-500 text-white py-2.5 px-5 rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Map fields */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
              <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>Categories are detected automatically by our classifier — no need to map them.</span>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Title column</label>
              <select className={selectClass} value={mapping.title} onChange={(e) => setMapping((m) => ({ ...m, title: e.target.value }))}>
                <option value="">Select column...</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Date column</label>
              <div className="grid grid-cols-2 gap-3">
                <select className={selectClass} value={mapping.date} onChange={(e) => setMapping((m) => ({ ...m, date: e.target.value }))}>
                  <option value="">Select column...</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <select className={selectClass} value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} aria-label="Date format">
                  {DATE_FORMATS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <span className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Amount</span>
              <div className="flex gap-4 mb-2 text-sm">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="amountMode" checked={amountMode === 'single'} onChange={() => setAmountMode('single')} />
                  Single signed column
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="amountMode" checked={amountMode === 'split'} onChange={() => setAmountMode('split')} />
                  Separate debit / credit
                </label>
              </div>

              {amountMode === 'single' ? (
                <>
                  <select className={selectClass} value={mapping.amount} onChange={(e) => setMapping((m) => ({ ...m, amount: e.target.value }))}>
                    <option value="">Select amount column...</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select className={`${selectClass} mt-3`} value={signConvention} onChange={(e) => setSignConvention(e.target.value)} aria-label="Sign convention">
                    {SIGN_CONVENTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block mb-1 text-sm text-gray-600 dark:text-gray-400">Debit (expense)</span>
                    <select className={selectClass} value={mapping.debit} onChange={(e) => setMapping((m) => ({ ...m, debit: e.target.value }))}>
                      <option value="">Select column...</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="block mb-1 text-sm text-gray-600 dark:text-gray-400">Credit (income)</span>
                    <select className={selectClass} value={mapping.credit} onChange={(e) => setMapping((m) => ({ ...m, credit: e.target.value }))}>
                      <option value="">Select column...</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 mt-2">
              <button type="button" onClick={() => setStep(0)} className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-5 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700">
                Back
              </button>
              <button
                type="button"
                disabled={!mappingValid}
                onClick={() => setStep(2)}
                className="bg-emerald-500 text-white py-2.5 px-5 rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white dark:bg-gray-900 p-3">
                <div className="text-2xl font-bold text-rose-500">{selectedExpenses.length}</div>
                <div className="text-xs text-gray-500">Expenses</div>
              </div>
              <div className="rounded-lg bg-white dark:bg-gray-900 p-3">
                <div className="text-2xl font-bold text-emerald-500">{selectedIncomes.length}</div>
                <div className="text-xs text-gray-500">Incomes</div>
              </div>
              <div className="rounded-lg bg-white dark:bg-gray-900 p-3">
                <div className="text-2xl font-bold text-amber-500">{normalized.invalid.length}</div>
                <div className="text-xs text-gray-500">Skipped (invalid)</div>
              </div>
            </div>

            <div className={`rounded-lg px-3 py-2 text-sm ${netDelta < 0 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'}`}>
              This import will change <span className="font-medium">{currentWalletName || 'the selected wallet'}</span> balance by{' '}
              <span className="font-semibold">{netDelta < 0 ? '-' : '+'}${Math.abs(netDelta).toFixed(2)}</span>.
              <span className="block text-gray-500 dark:text-gray-400 mt-0.5">Duplicates already in this wallet will be skipped automatically.</span>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 text-left">
                  <tr>
                    <th className="p-2 w-8"></th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Date</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {[...normalized.expenses, ...normalized.incomes].length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No valid rows to import.</td></tr>
                  )}
                  {[...normalized.expenses, ...normalized.incomes].map((entry) => (
                    <tr key={keyOf(entry)} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-2">
                        <input type="checkbox" checked={isIncluded(entry)} onChange={() => toggleEntry(entry)} aria-label={`Include ${entry.title}`} />
                      </td>
                      <td className="p-2 text-gray-900 dark:text-gray-100">{entry.title}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-400">{entry.date}</td>
                      <td className="p-2 text-right tabular-nums">${entry.amount.toFixed(2)}</td>
                      <td className="p-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${entry.kind === 'expense' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                          {entry.kind}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {submitError && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">{submitError}</p>
            )}

            <div className="flex justify-between gap-3 mt-2">
              <button type="button" disabled={submitting} onClick={() => setStep(1)} className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-5 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">
                Back
              </button>
              <button
                type="button"
                disabled={submitting || (selectedExpenses.length === 0 && selectedIncomes.length === 0)}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 bg-emerald-500 text-white py-2.5 px-5 rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpTrayIcon className="w-5 h-5" aria-hidden="true" />
                {submitting ? 'Importing...' : `Import ${selectedExpenses.length + selectedIncomes.length} entr${selectedExpenses.length + selectedIncomes.length === 1 ? 'y' : 'ies'}`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Result */}
        {step === 3 && result && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center text-center py-2">
              <span className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 text-white mb-3">
                <CheckIcon className="w-8 h-8" aria-hidden="true" />
              </span>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import complete</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Added {result.expenseInserted} expense{result.expenseInserted === 1 ? '' : 's'} and {result.incomeInserted} income{result.incomeInserted === 1 ? '' : 's'}.
              </p>
            </div>

            {result.skipped.length > 0 && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  {result.skipped.length} duplicate{result.skipped.length === 1 ? '' : 's'} skipped (already in this wallet):
                </p>
                <ul className="max-h-40 overflow-y-auto text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {result.skipped.map((s, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="truncate">{s.title}</span>
                      <span className="whitespace-nowrap">{s.date} · ${Number(s.amount).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end mt-2">
              <button type="button" onClick={handleClose} className="bg-emerald-500 text-white py-2.5 px-5 rounded-xl font-medium hover:bg-emerald-600">
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      <AddWallet
        isOpen={showAddWallet}
        onClose={() => setShowAddWallet(false)}
        onAdd={handleAddWalletSubmit}
      />
    </div>
  )
}
