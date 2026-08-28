'use client'

import React, { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { socketClient } from '@/lib/socket/socket-client'
import { ToastContainer } from '../ui/ToastContainer'

interface DashboardLayoutProps {
  children: ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter()
  const { isAuthenticated, access_token } = useAuthStore()
  const { isSidebarOpen } = useUIStore()
  const [mounted, setMounted] = React.useState(false)

  // Wait for hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Protection & Socket Init
  useEffect(() => {
    if (!mounted) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (access_token) {
      socketClient.connect(access_token)
    }

    return () => {
      socketClient.disconnect()
    }
  }, [isAuthenticated, access_token, router, mounted])

  if (!mounted || !isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <Sidebar />
      <Header />
      
      <main 
        className="pt-14 transition-all duration-200 min-h-screen"
        style={{ paddingLeft: isSidebarOpen ? '240px' : '72px' }}
      >
        <div className="px-8 py-7 pb-14 max-w-[1340px] mx-auto min-w-0 w-full">
          {children}
        </div>
      </main>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  )
}
