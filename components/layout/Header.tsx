'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Search, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'

export const Header: React.FC = () => {
  const router = useRouter()
  const { user, clearSession } = useAuthStore()
  const { isSidebarOpen } = useUIStore()

  const handleLogout = async () => {
    // In a real app, call API POST /auth/logout here
    clearSession()
    router.push('/login')
  }

  return (
    <header 
      className={`fixed top-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-30 transition-all duration-300`}
      style={{ left: isSidebarOpen ? '280px' : '80px' }}
    >
      <div className="h-full px-8 flex items-center justify-between">
        {/* Search Bar - Aesthetic Only for now */}
        <div className="relative w-96 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Clinic Name - Mocked */}
          <div className="hidden lg:block text-right mr-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clínica</p>
            <p className="text-sm font-bold text-slate-800">Deviaty Dental Care</p>
          </div>

          {/* Notifications */}
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="h-8 w-px bg-slate-100 mx-2"></div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{user?.email?.split('@')[0] || 'Usuario'}</p>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{user?.role?.name || 'Agente'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <UserIcon size={20} />
            </div>
            <button 
              onClick={handleLogout}
              className="ml-2 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
