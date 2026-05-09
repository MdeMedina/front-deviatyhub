'use client'

import React, { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null // or a loading spinner
  }
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar placeholder */}
      <aside className="w-64 bg-white border-r">
        <div className="p-4 font-bold text-xl">Deviaty Hub</div>
        <nav className="mt-4">
          {/* Links will go here */}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header placeholder */}
        <header className="h-16 bg-white border-b flex items-center px-8">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
