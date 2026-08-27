'use client'

import React from 'react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)] p-4">
      <div className="flex flex-col items-center text-center bg-[var(--card)] border border-[var(--line)] rounded-[10px] shadow-[0_1px_2px_rgba(20,20,25,0.05)] p-8 max-w-md w-full">
        <p className="display text-[48px] leading-none text-[var(--blue)] mb-3">404</p>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Page Not Found</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
        </p>
        <Link
          href="/conversations"
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--ink)] hover:opacity-85 text-[var(--bg)] font-medium rounded-[7px] text-[13px] transition-opacity"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
