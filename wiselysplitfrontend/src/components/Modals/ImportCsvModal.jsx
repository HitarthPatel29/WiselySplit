// src/components/Modals/ImportCsvModal.jsx
// Multi-step wizard to import personal expenses & incomes from a CSV file.
// Steps: 1) Wallet  2) Map fields  3) Review  4) Result
// Categories are intentionally NOT mapped here: the backend classifier assigns
// expense categories, and income categories are left empty.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  XMarkIcon,
  InformationCircleIcon,
  CheckIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/solid'
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
import ImportStepBar from './importCsv/ImportStepBar'
import ImportStepFooter from './importCsv/ImportStepFooter'
import ImportSectionCard from './importCsv/ImportSectionCard'
import ImportFileDropzone from './importCsv/ImportFileDropzone'
import ImportReviewList from './importCsv/ImportReviewList'
import { selectClass } from './importCsv/constants'

export default function ImportCsvModal({
  isOpen,
  onClose,
  wallets = [],
  userId,
  defaultWalletId = null,
  createWallet,
  onImported,
}) {
  const modalRef = useRef(null)
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
  const [showInvalidDetails, setShowInvalidDetails] = useState(false)

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
    setShowInvalidDetails(false)
  }

  useEffect(() => {
    if (isOpen) {
      resetAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      if (firstElement) firstElement.focus()
    }
  }, [isOpen, step])

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

  const allEntries = useMemo(
    () => [...normalized.expenses, ...normalized.incomes],
    [normalized.expenses, normalized.incomes]
  )

  const includeAll = () => setExcluded(new Set())
  const excludeAll = () => setExcluded(new Set(allEntries.map(keyOf)))

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

  const importCount = selectedExpenses.length + selectedIncomes.length
  const importLabel = submitting
    ? 'Importing…'
    : `Import ${importCount} entr${importCount === 1 ? 'y' : 'ies'}`

  const renderFooter = () => {
    if (step === 0) {
      return (
        <ImportStepFooter
          showCancel
          onCancel={handleClose}
          primaryLabel="Next"
          onPrimary={() => setStep(1)}
          primaryDisabled={!walletId || rows.length === 0}
          align="end"
        />
      )
    }
    if (step === 1) {
      return (
        <ImportStepFooter
          showBack
          onBack={() => setStep(0)}
          primaryLabel="Next"
          onPrimary={() => setStep(2)}
          primaryDisabled={!mappingValid}
        />
      )
    }
    if (step === 2) {
      return (
        <ImportStepFooter
          showBack
          onBack={() => setStep(1)}
          primaryLabel={importLabel}
          onPrimary={handleSubmit}
          primaryDisabled={submitting || importCount === 0}
          primaryBusy={submitting}
          primaryIcon={<ArrowUpTrayIcon className="w-5 h-5" aria-hidden="true" />}
        />
      )
    }
    if (step === 3) {
      return (
        <ImportStepFooter
          primaryLabel="Done"
          onPrimary={handleClose}
          align="end"
        />
      )
    }
    return null
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center sm:px-4"
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-csv-title"
        className="bg-gray-100 dark:bg-gray-800 w-full sm:max-w-2xl max-sm:min-h-[100dvh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-xl shadow-2xl shadow-black relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex-shrink-0 px-4 pt-4 sm:px-6 sm:pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
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
          {step < 3 && <ImportStepBar current={step} />}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0">
          {/* STEP 0: Wallet */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <ImportSectionCard title="Import into wallet">
                {wallets.length > 0 ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select wallet
                      </label>
                      <div className="relative">
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
                        <ChevronDownIcon
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none"
                          aria-hidden
                        />
                      </div>
                    </div>
                    {currentWalletName && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Importing into <span className="font-semibold">{currentWalletName}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You don&apos;t have any wallets yet. Create one to continue.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddWallet(true)}
                  className="self-start text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  + Add Wallet / Card
                </button>
              </ImportSectionCard>

              <ImportSectionCard title="CSV file">
                <ImportFileDropzone
                  fileInputRef={fileInputRef}
                  onChange={handleFile}
                  fileName={fileName}
                  rowCount={rows.length}
                  parseError={parseError}
                  maxRows={MAX_CSV_ROWS}
                />
              </ImportSectionCard>
            </div>
          )}

          {/* STEP 1: Map fields */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>Categories are assigned automatically — no column mapping needed.</span>
              </div>

              <ImportSectionCard title="Columns">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">Title column</label>
                  <div className="relative">
                    <select className={selectClass} value={mapping.title} onChange={(e) => setMapping((m) => ({ ...m, title: e.target.value }))}>
                      <option value="">Select column...</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" aria-hidden />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">Date column</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <select className={selectClass} value={mapping.date} onChange={(e) => setMapping((m) => ({ ...m, date: e.target.value }))}>
                        <option value="">Select column...</option>
                        {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" aria-hidden />
                    </div>
                    <div className="relative">
                      <select className={selectClass} value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} aria-label="Date format">
                        {DATE_FORMATS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" aria-hidden />
                    </div>
                  </div>
                </div>
              </ImportSectionCard>

              <ImportSectionCard title="Amount">
                <div className="flex rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden" role="radiogroup" aria-label="Amount mapping mode">
                  <label
                    className={`flex-1 text-center text-sm py-2.5 px-3 cursor-pointer transition-colors ${
                      amountMode === 'single'
                        ? 'bg-emerald-500 text-white font-medium'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input type="radio" name="amountMode" checked={amountMode === 'single'} onChange={() => setAmountMode('single')} className="sr-only" />
                    Single column
                  </label>
                  <label
                    className={`flex-1 text-center text-sm py-2.5 px-3 cursor-pointer transition-colors border-l border-gray-300 dark:border-gray-600 ${
                      amountMode === 'split'
                        ? 'bg-emerald-500 text-white font-medium'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input type="radio" name="amountMode" checked={amountMode === 'split'} onChange={() => setAmountMode('split')} className="sr-only" />
                    Debit &amp; credit
                  </label>
                </div>

                {amountMode === 'single' ? (
                  <>
                    <div className="relative">
                      <select className={selectClass} value={mapping.amount} onChange={(e) => setMapping((m) => ({ ...m, amount: e.target.value }))}>
                        <option value="">Select amount column...</option>
                        {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" aria-hidden />
                    </div>
                    <div className="relative">
                      <select className={selectClass} value={signConvention} onChange={(e) => setSignConvention(e.target.value)} aria-label="Sign convention">
                        {SIGN_CONVENTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" aria-hidden />
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="block mb-1 text-sm text-gray-600 dark:text-gray-400">Debit (expense)</span>
                      <div className="relative">
                        <select className={selectClass} value={mapping.debit} onChange={(e) => setMapping((m) => ({ ...m, debit: e.target.value }))}>
                          <option value="">Select column...</option>
                          {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" aria-hidden />
                      </div>
                    </div>
                    <div>
                      <span className="block mb-1 text-sm text-gray-600 dark:text-gray-400">Credit (income)</span>
                      <div className="relative">
                        <select className={selectClass} value={mapping.credit} onChange={(e) => setMapping((m) => ({ ...m, credit: e.target.value }))}>
                          <option value="">Select column...</option>
                          {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" aria-hidden />
                      </div>
                    </div>
                  </div>
                )}
              </ImportSectionCard>

              {mappingValid && (
                <p className="text-sm text-gray-600 dark:text-gray-400 rounded-lg bg-gray-50 dark:bg-gray-900/50 px-3 py-2">
                  Preview: {normalized.expenses.length} expense{normalized.expenses.length === 1 ? '' : 's'},{' '}
                  {normalized.incomes.length} income{normalized.incomes.length === 1 ? '' : 's'},{' '}
                  {normalized.invalid.length} invalid
                </p>
              )}
            </div>
          )}

          {/* STEP 2: Review */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="flex sm:flex-col items-center justify-between sm:justify-center rounded-lg bg-white dark:bg-gray-900 p-3 sm:text-center gap-2">
                  <div className="text-2xl font-bold text-rose-500">{selectedExpenses.length}</div>
                  <div className="text-xs text-gray-500">Expenses</div>
                </div>
                <div className="flex sm:flex-col items-center justify-between sm:justify-center rounded-lg bg-white dark:bg-gray-900 p-3 sm:text-center gap-2">
                  <div className="text-2xl font-bold text-emerald-500">{selectedIncomes.length}</div>
                  <div className="text-xs text-gray-500">Incomes</div>
                </div>
                <div className="flex sm:flex-col items-center justify-between sm:justify-center rounded-lg bg-white dark:bg-gray-900 p-3 sm:text-center gap-2">
                  <div className="text-2xl font-bold text-amber-500">{normalized.invalid.length}</div>
                  <div className="text-xs text-gray-500">Skipped (invalid)</div>
                </div>
              </div>

              <div className={`rounded-lg px-3 py-3 text-sm ${netDelta < 0 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'}`}>
                <p>
                  This import will change{' '}
                  <span className="font-bold">{currentWalletName || 'the selected wallet'}</span>{' '}
                  balance by{' '}
                  <span className="text-base font-bold tabular-nums">
                    {netDelta < 0 ? '-' : '+'}${Math.abs(netDelta).toFixed(2)}
                  </span>
                </p>
                <span className="block text-gray-500 dark:text-gray-400 mt-1 text-xs">
                  Duplicates already in this wallet will be skipped automatically.
                </span>
              </div>

              {normalized.invalid.length > 0 && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                  <button
                    type="button"
                    onClick={() => setShowInvalidDetails((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-amber-800 dark:text-amber-200"
                  >
                    {normalized.invalid.length} invalid row{normalized.invalid.length === 1 ? '' : 's'} will not be imported
                    <span className="text-xs">{showInvalidDetails ? 'Hide' : 'Show'}</span>
                  </button>
                  {showInvalidDetails && (
                    <ul className="px-3 pb-2 text-xs text-amber-700 dark:text-amber-300 space-y-1 max-h-24 overflow-y-auto">
                      {normalized.invalid.map((inv, i) => (
                        <li key={i}>Row {inv.rowIndex + 2}: {inv.reason || 'could not parse'}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {allEntries.length > 0 && (
                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    onClick={includeAll}
                    className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                  >
                    Include all
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={excludeAll}
                    className="text-gray-600 dark:text-gray-400 font-medium hover:underline"
                  >
                    Exclude all
                  </button>
                </div>
              )}

              <ImportReviewList
                entries={allEntries}
                keyOf={keyOf}
                isIncluded={isIncluded}
                toggleEntry={toggleEntry}
              />

              {submitError && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-3 py-2 text-sm text-rose-700 dark:text-rose-300" role="alert">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Result */}
          {step === 3 && result && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center text-center py-4">
                <span className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 text-white mb-4">
                  <CheckIcon className="w-9 h-9" aria-hidden="true" />
                </span>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">Import complete</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Added {result.expenseInserted} expense{result.expenseInserted === 1 ? '' : 's'} and{' '}
                  {result.incomeInserted} income{result.incomeInserted === 1 ? '' : 's'}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-white dark:bg-gray-900 p-4 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-rose-500">{result.expenseInserted}</div>
                  <div className="text-xs text-gray-500 mt-1">Expenses added</div>
                </div>
                <div className="rounded-lg bg-white dark:bg-gray-900 p-4 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-emerald-500">{result.incomeInserted}</div>
                  <div className="text-xs text-gray-500 mt-1">Incomes added</div>
                </div>
              </div>

              {result.skipped.length > 0 && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    {result.skipped.length} duplicate{result.skipped.length === 1 ? '' : 's'} skipped (already in this wallet):
                  </p>
                  <ul className="max-h-40 overflow-y-auto text-sm text-amber-700 dark:text-amber-300 space-y-2">
                    {result.skipped.map((s, i) => (
                      <li key={i} className="border-b border-amber-200/50 dark:border-amber-800/50 pb-2 last:border-0 last:pb-0">
                        <p className="font-medium truncate">{s.title}</p>
                        <p className="text-xs mt-0.5">{s.date} · ${Number(s.amount).toFixed(2)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        {step <= 3 && (
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {renderFooter()}
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
