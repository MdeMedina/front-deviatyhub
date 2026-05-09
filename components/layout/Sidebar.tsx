'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Calendar, 
  Book, 
  Wand2, 
  PlayCircle, 
  BarChart3, 
  Puzzle, 
  Settings, 
  Users, 
  Lock,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { label: 'Conversaciones', href: '/conversations', icon: MessageSquare, permission: 'conversations.view' },
  { label: 'Agenda', href: '/agenda', icon: Calendar, permission: 'agenda.view' },
  { label: 'Base conocimiento', href: '/knowledge-base', icon: Book, permission: 'knowledge_base.view' },
  { label: 'Acciones agente', href: '/agent-actions', icon: Wand2, permission: 'agent_actions.view' },
  { label: 'Simulador', href: '/simulator', icon: PlayCircle, permission: 'simulator.view' },
  { label: 'Métricas', href: '/metrics', icon: BarChart3, permission: 'metrics.view' },
  { label: 'Integraciones', href: '/integrations', icon: Puzzle, permission: 'integrations.view' },
  { label: 'Configuración', href: '/settings', icon: Settings, permission: 'clinic_config.view' },
  { label: 'Usuarios', href: '/users', icon: Users, permission: 'users.view' },
  { label: 'Seguridad', href: '/security', icon: Lock, permission: 'security.view' },
]

export const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const { hasPermission } = useAuthStore()
  const { isSidebarOpen, toggleSidebar } = useUIStore()

  const filteredItems = NAV_ITEMS.filter(item => 
    !item.permission || hasPermission(item.permission as any)
  )

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 280 : 80 }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-slate-100 flex flex-col z-40"
    >
      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 justify-between border-b border-slate-50">
        {isSidebarOpen && (
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            DeviatyHub
          </span>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors ml-auto"
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1 custom-scrollbar">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon size={22} className={isActive ? 'text-indigo-600' : 'group-hover:text-indigo-500 transition-colors'} />
              
              {isSidebarOpen && (
                <span className="whitespace-nowrap text-sm">
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed mode */}
              {!isSidebarOpen && (
                <div className="absolute left-16 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}

              {isActive && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer / Info */}
      {isSidebarOpen && (
        <div className="p-6 border-t border-slate-50">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plan Actual</p>
            <p className="text-sm font-semibold text-slate-700">Enterprise Pro</p>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
