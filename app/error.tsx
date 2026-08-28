'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)] p-4">
      <div className="flex flex-col items-center text-center bg-[var(--card)] border border-[var(--line)] rounded-[10px] shadow-[0_1px_2px_rgba(20,20,25,0.05)] p-8 max-w-md w-full">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-4">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Something went wrong!</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
          An unexpected error has occurred. Our team has been notified and is working to fix it.
        </p>
        <button onClick={() => reset()} data-btn="primary">
          Try again
        </button>
      </div>
    </div>
  )
}
