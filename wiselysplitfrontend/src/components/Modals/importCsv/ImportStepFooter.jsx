import React from 'react'
import PrimaryButton from '../../IO/PrimaryButton'

const secondaryBtnClass =
  'w-full sm:w-auto border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-5 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400'

export default function ImportStepFooter({
  showBack = false,
  showCancel = false,
  onBack,
  onCancel,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryBusy = false,
  primaryAriaLabel,
  primaryClassName = '',
  primaryIcon = null,
  align = 'between',
}) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row gap-3 ${
        align === 'end' ? 'sm:justify-end' : 'sm:justify-between'
      }`}
    >
      <div className={`flex flex-col-reverse sm:flex-row gap-3 ${showBack && showCancel ? 'sm:gap-3' : ''}`}>
        {showBack && (
          <button type="button" onClick={onBack} disabled={primaryBusy} className={secondaryBtnClass}>
            Back
          </button>
        )}
        {showCancel && (
          <button type="button" onClick={onCancel} disabled={primaryBusy} className={secondaryBtnClass}>
            Cancel
          </button>
        )}
      </div>
      <PrimaryButton
        label={
          <span className="inline-flex items-center justify-center gap-2">
            {primaryIcon}
            {primaryLabel}
          </span>
        }
        onClick={onPrimary}
        disabled={primaryDisabled}
        ariaBusy={primaryBusy}
        ariaLabel={primaryAriaLabel}
        className={`w-full sm:w-auto py-2.5 px-5 ${primaryClassName}`.trim()}
      />
    </div>
  )
}
