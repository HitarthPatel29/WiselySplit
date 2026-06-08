import React from 'react'
import Logo from '../Logo'
import BrandBackdrop, { useBrandBackdropMotion } from '../background/CursorAnimatedBG'

export default function AuthLayout({ children, title, subtitle, footer, withlogo = false }) {
  const { mouseX, mouseY, onMouseMove, reducedMotion } = useBrandBackdropMotion()

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-8 px-10 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300"
      role="main"
      id="main-content"
      onMouseMove={reducedMotion ? undefined : onMouseMove}
    >
      <BrandBackdrop reducedMotion={reducedMotion} mouseX={mouseX} mouseY={mouseY} />

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 sm:p-8 transition-colors duration-300 text-gray-900 dark:text-gray-100">
          <header>
            {withlogo && (
              <div className="flex justify-center">
                <div className="scale-75 sm:scale-90 md:scale-100">
                  <Logo size={90} />
                </div>
              </div>
            )}
            <h1 className="text-2xl font-semibold text-center">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-center text-gray-500 dark:text-gray-400 text-sm">
                {subtitle}
              </p>
            ) : null}
          </header>
          <div className="mt-6" role="region" aria-label="Authentication form">
            {children}
          </div>
          {footer ? <footer className="mt-6">{footer}</footer> : null}
        </div>
      </div>
    </div>
  )
}
