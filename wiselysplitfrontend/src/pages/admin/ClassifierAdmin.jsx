// src/pages/admin/ClassifierAdmin.jsx
// Admin console for the SMILE expense-category classifier.

import React, { useCallback, useEffect, useState } from 'react'
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  BeakerIcon,
  CheckBadgeIcon,
  CircleStackIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  RectangleStackIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid'
import Header from '../../components/Header.jsx'
import api from '../../api'
import { useNotification } from '../../context/NotificationContext'

const SOURCE_COLORS = {
  seed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  user_confirmed:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  user_corrected:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

const inputClass =
  'w-full appearance-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'

function formatTimestamp(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return String(ts)
  }
}

function formatBytes(n) {
  if (n == null) return '—'
  const num = Number(n)
  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${(num / (1024 * 1024)).toFixed(2)} MB`
}

function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          {Icon ? <Icon className="w-5 h-5 text-emerald-500" aria-hidden /> : null}
          <h2 className="font-semibold">{title}</h2>
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Stat({ label, value, hint }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</span>
      {hint ? <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</span> : null}
    </div>
  )
}

function Pill({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  )
}

export default function ClassifierAdmin() {
  const { showSuccess, showError, showAlert } = useNotification()

  const [status, setStatus] = useState(null)
  const [stats, setStats] = useState(null)
  const [models, setModels] = useState([])

  const [refreshing, setRefreshing] = useState(false)
  const [retraining, setRetraining] = useState(false)
  const [seedReloading, setSeedReloading] = useState(false)
  const [predictTitle, setPredictTitle] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [predicting, setPredicting] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/classify/status')
      setStatus(data)
    } catch (e) {
      console.error('Failed to load classifier status', e)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/classify/stats')
      setStats(data)
    } catch (e) {
      console.error('Failed to load classifier stats', e)
    }
  }, [])

  const loadModels = useCallback(async () => {
    try {
      const { data } = await api.get('/classify/models')
      setModels(data.models || [])
    } catch (e) {
      console.error('Failed to load model history', e)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadStatus(), loadStats(), loadModels()])
    setRefreshing(false)
  }, [loadStatus, loadStats, loadModels])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const handlePredict = async (e) => {
    e?.preventDefault?.()
    const title = predictTitle.trim()
    if (!title) return
    setPredicting(true)
    setPrediction(null)
    try {
      const { data } = await api.get('/classify/predict', { params: { title } })
      setPrediction(data)
    } catch (err) {
      showError(err.response?.data?.error || 'Prediction failed', { asSnackbar: true })
    } finally {
      setPredicting(false)
    }
  }

  const handleRetrain = () => {
    showAlert({
      title: 'Retrain classifier?',
      message: `This will train a fresh model on all ${stats?.totalRows ?? '—'} labeled rows, persist it as a new version, and hot-swap it into the live service.`,
      type: 'warning',
      confirmText: 'Retrain',
      onConfirm: async () => {
        setRetraining(true)
        try {
          const { data } = await api.post('/classify/retrain')
          showSuccess(
            `Trained v${data.version} on ${data.trainingSize} rows`,
            { asSnackbar: true }
          )
          await refreshAll()
        } catch (err) {
          showError(err.response?.data?.error || 'Retrain failed', { asSnackbar: true })
        } finally {
          setRetraining(false)
        }
      },
    })
  }

  const handleRetrainFromSeed = () => {
    showAlert({
      title: 'Retrain from seed CSV?',
      message:
        'This will replace all rows sourced from `seed_categories.csv` with the current CSV contents (user confirmations and corrections are preserved), then train and hot-swap a fresh model.',
      type: 'warning',
      confirmText: 'Retrain from seed',
      onConfirm: async () => {
        setSeedReloading(true)
        try {
          const { data } = await api.post('/classify/retrain-from-seed')
          showSuccess(
            `Reloaded ${data.seedRows} seed rows · trained v${data.version} on ${data.trainingSize} rows`,
            { asSnackbar: true }
          )
          await refreshAll()
        } catch (err) {
          showError(err.response?.data?.error || 'Retrain from seed failed', { asSnackbar: true })
        } finally {
          setSeedReloading(false)
        }
      },
    })
  }

  const labelCounts = stats?.byLabel ? Object.entries(stats.byLabel) : []
  const maxLabelCount = labelCounts.reduce((m, [, n]) => Math.max(m, Number(n) || 0), 0)
  const sourceCounts = stats?.bySource ? Object.entries(stats.bySource) : []
  const activeVersion = models[0]?.version ?? null

  return (
    <div className="min-h-screen">
      <Header title="Classifier Admin" />
      <main
        id="main-content"
        className="max-w-5xl mx-auto px-4 py-5 flex flex-col gap-5"
        role="main"
      >
        {/* Overview */}
        <SectionCard
          title="Classifier overview"
          icon={CpuChipIcon}
          action={
            <button
              type="button"
              onClick={refreshAll}
              disabled={refreshing}
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
            >
              <ArrowPathIcon
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Refresh
            </button>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat
              label="Status"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {status?.ready ? (
                    <>
                      <CheckBadgeIcon
                        className="w-6 h-6 text-emerald-500"
                        aria-hidden
                      />
                      <span className="text-emerald-600 dark:text-emerald-400">Ready</span>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon
                        className="w-6 h-6 text-amber-500"
                        aria-hidden
                      />
                      <span className="text-amber-600 dark:text-amber-400">Cold</span>
                    </>
                  )}
                </span>
              }
              hint={status?.ready ? 'Serving predictions' : 'Model not loaded'}
            />
            <Stat
              label="Active version"
              value={activeVersion ? `v${activeVersion}` : '—'}
              hint={
                models.length
                  ? `${models.length} version${models.length === 1 ? '' : 's'} stored`
                  : 'No persisted models'
              }
            />
            <Stat
              label="Training size"
              value={stats?.activeTrainingSize ?? status?.trainingSize ?? '—'}
              hint="Rows used in active model"
            />
            <Stat
              label="Total labeled rows"
              value={stats?.totalRows ?? '—'}
              hint={
                (status?.classes?.length ?? 0) +
                ' classes loaded'
              }
            />
          </div>

          {status?.classes?.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {status.classes.map((c) => (
                <Pill
                  key={c}
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                >
                  {c}
                </Pill>
              ))}
            </div>
          ) : null}
        </SectionCard>

        {/* Tester + Retrain side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard title="Live prediction tester" icon={BeakerIcon}>
            <form onSubmit={handlePredict} className="flex flex-col gap-2">
              <label
                htmlFor="predict-title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Expense title
              </label>
              <input
                id="predict-title"
                type="text"
                value={predictTitle}
                onChange={(e) => setPredictTitle(e.target.value)}
                placeholder="e.g. Uber Eats Saturday night"
                className={inputClass}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={predicting || !predictTitle.trim()}
                className="self-start inline-flex items-center gap-1.5 mt-1 rounded-xl bg-emerald-500 text-white font-medium px-4 py-2 hover:bg-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-4 h-4" aria-hidden />
                {predicting ? 'Predicting…' : 'Predict'}
              </button>
            </form>

            <div className="mt-4 min-h-[3.5rem]" aria-live="polite">
              {prediction ? (
                prediction.category ? (
                  <div className="flex flex-col gap-1.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-900/20 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                        Predicted category
                      </span>
                      {prediction.confident ? (
                        <Pill className="bg-emerald-500 text-white">confident</Pill>
                      ) : (
                        <Pill className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          low confidence
                        </Pill>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {prediction.category}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round((prediction.confidence ?? 0) * 10000) / 100}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-gray-500 dark:text-gray-400">
                    No confident match — model has no vocabulary overlap with this title.
                  </p>
                )
              ) : (
                <p className="text-sm italic text-gray-400 dark:text-gray-500">
                  Run a prediction to test the live model.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Retrain model" icon={ArrowPathIcon}>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Pulls every row from <code className="text-xs">training_data</code>, fits a
              new <strong>Discrete Naive Bayes</strong> model, persists it as a new version
              in <code className="text-xs">model_store</code>, and hot-swaps it into the
              live classifier (no restart needed).
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc pl-4 space-y-0.5 mb-4">
              <li>
                Auto-retrains every <strong>10</strong> new feedback rows in the background.
              </li>
              <li>Manual retrain is useful after a curation/cleanup pass.</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRetrain}
                disabled={retraining || seedReloading || (stats?.totalRows ?? 0) === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 text-white font-medium px-4 py-2 hover:bg-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon
                  className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`}
                  aria-hidden
                />
                {retraining ? 'Retraining…' : 'Retrain now'}
              </button>
              <button
                type="button"
                onClick={handleRetrainFromSeed}
                disabled={retraining || seedReloading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
                title="Replaces seed rows from seed_categories.csv, keeps user feedback, then retrains."
              >
                <ArrowUturnLeftIcon
                  className={`w-4 h-4 ${seedReloading ? 'animate-spin' : ''}`}
                  aria-hidden
                />
                {seedReloading ? 'Reseeding…' : 'Retrain from seed CSV'}
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Source breakdown */}
        <SectionCard title="Training-data sources" icon={CircleStackIcon}>
          {sourceCounts.length === 0 ? (
            <p className="text-sm italic text-gray-400 dark:text-gray-500">No data yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sourceCounts.map(([src, n]) => (
                <Pill
                  key={src}
                  className={`${SOURCE_COLORS[src] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'} text-sm`}
                >
                  {src}: <strong className="ml-1">{n}</strong>
                </Pill>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Per-category breakdown */}
        <SectionCard title="Rows per category" icon={RectangleStackIcon}>
          {labelCounts.length === 0 ? (
            <p className="text-sm italic text-gray-400 dark:text-gray-500">No data yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {labelCounts.map(([label, n]) => {
                const pct = maxLabelCount ? (Number(n) / maxLabelCount) * 100 : 0
                return (
                  <li key={label} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 text-sm text-gray-800 dark:text-gray-200 truncate">
                      {label}
                    </span>
                    <div
                      className="flex-1 h-2 rounded-full bg-gray-200/60 dark:bg-gray-700/60 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={n}
                      aria-valuemin={0}
                      aria-valuemax={maxLabelCount || 1}
                      aria-label={`${label} count`}
                    >
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm tabular-nums text-gray-600 dark:text-gray-300">
                      {n}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>

        {/* Model history */}
        <SectionCard title="Model history" icon={CpuChipIcon}>
          {models.length === 0 ? (
            <p className="text-sm italic text-gray-400 dark:text-gray-500">
              No persisted versions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-3">Version</th>
                    <th className="py-2 pr-3">Algorithm</th>
                    <th className="py-2 pr-3">Training size</th>
                    <th className="py-2 pr-3">Blob</th>
                    <th className="py-2 pr-3">Classes</th>
                    <th className="py-2 pr-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, idx) => {
                    const isActive = idx === 0
                    const classesArr = m.classes
                      ? String(m.classes).split(',').filter(Boolean)
                      : []
                    return (
                      <tr
                        key={m.modelId ?? m.version}
                        className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                      >
                        <td className="py-2 pr-3 font-medium text-gray-900 dark:text-gray-100">
                          v{m.version}
                          {isActive ? (
                            <Pill className="ml-2 bg-emerald-500 text-white">active</Pill>
                          ) : null}
                        </td>
                        <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                          {m.algorithm ?? 'NaiveBayes'}
                        </td>
                        <td className="py-2 pr-3 tabular-nums text-gray-600 dark:text-gray-300">
                          {m.trainingSize ?? '—'}
                        </td>
                        <td className="py-2 pr-3 tabular-nums text-gray-600 dark:text-gray-300">
                          {formatBytes(m.blobBytes)}
                        </td>
                        <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                          {classesArr.length}
                        </td>
                        <td className="py-2 pr-3 text-gray-500 dark:text-gray-400">
                          {formatTimestamp(m.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </main>
    </div>
  )
}
